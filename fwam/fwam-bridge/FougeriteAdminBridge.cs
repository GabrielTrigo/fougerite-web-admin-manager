using Fougerite;
using Fougerite.Events;
using System;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;

namespace FougeriteAdminBridge
{
    // =========================================================================================
    // ESTRUTURA DE TELEMETRIA
    // =========================================================================================
    public struct GameEvent
    {
        public string Type;
        public long Timestamp;
        public string PlayerUID;
        public string PlayerName;
        public string Payload;
    }

    // =========================================================================================
    // KERNEL DO PLUGIN
    // Herda da API Nativa do Magma/Fougerite para atuar internamente no servidor.
    // =========================================================================================
    public class FougeriteAdminBridge : Fougerite.Module
    {
        public override string Name { get { return "FWAM Bridge"; } }
        public override string Author { get { return "GabrielTrigo"; } }
        public override string Description { get { return "Zero-Latency Event Producer & Command Dispatcher"; } }
        public override Version Version { get { return new Version("1.1.0"); } }

        private string _redisHost = "127.0.0.1";
        private int _redisPort = 6379;
        private string _eventList = "fwam:events";
        private string _commandChan = "fwam:commands";
        private const int BATCH_SIZE = 50;
        private const int MAX_QUEUE_SIZE = 15000;
        private const int CONSUMER_SLEEP = 50;   // ms entre batches
        private const int RETRY_SLEEP = 5000; // ms em backoff de erro

        // Feature Set Telemetry Configs
        private int _heatmapSampleMs = 5000;

        // Dynamic Hook States (Controlado via Web)
        private bool _heatmapOn = false;
        private bool _craftingOn = false;
        private bool _gatheringOn = false;

        // Downsampling State
        private readonly Dictionary<string, long> _lastMoveTime = new Dictionary<string, long>();

        // Fila Lock-Safe compatível com Mono 2.6.5 do Rust Legacy
        private readonly Queue<GameEvent> _eventQueue = new Queue<GameEvent>();
        private readonly object _queueLock = new object();

        // Core Threading
        private Thread _consumerThread;
        private Thread _receiverThread;
        private volatile bool _isRunning = false;

        public override void Initialize()
        {
            LoadConfig();

            Logger.Log("[FWAM] Starting Raw TCP Redis Engine (no external deps)...");

            _isRunning = true;

            // 1) Inicia o Background Consumer Loop (Enviando Telemetria via LPUSH)
            _consumerThread = new Thread(ConsumerLoop)
            {
                IsBackground = true,
                Priority = System.Threading.ThreadPriority.BelowNormal,
                Name = "FWAM_EventConsumer"
            };
            _consumerThread.Start();

            // 2) Inicia a Background Receiver Thread (Recebendo Comandos via SUBSCRIBE)
            _receiverThread = new Thread(ReceiverLoop)
            {
                IsBackground = true,
                Name = "FWAM_CommandReceiver"
            };
            _receiverThread.Start();

            // 3) Inscreve os Hooks Nativos Principais
            Hooks.OnPlayerConnected += OnPlayerConnected;
            Hooks.OnPlayerDisconnected += OnPlayerDisconnected;
            Hooks.OnChat += OnChat;
            Hooks.OnPlayerHurt += OnPlayerHurt;
            Hooks.OnPlayerKilled += OnPlayerKilled;
            Hooks.OnPlayerApproval += OnPlayerApproval; // Fundamental para 4.2 Segurança (Bans/Blacklist/Flood)

            Logger.Log("[FWAM] Hooks nativos principais registrados. Telemetria básica ativa.");
        }

        private void LoadConfig()
        {
            string cfgFile = System.IO.Path.Combine(ModuleFolder, "FWAMBridge.ini");

            if (!System.IO.File.Exists(cfgFile))
            {
                System.IO.File.WriteAllText(cfgFile,
@"[Redis]
Host=172.22.179.75
Port=6379

[Channels]
EventsList=fwam:events
CommandsChannel=fwam:commands
");
                Logger.Log("[FWAM] Created default config at: " + cfgFile);
            }

            try
            {
                var config = new IniParser(cfgFile);
                _redisHost = config.GetSetting("Redis", "Host");
                _redisPort = int.Parse(config.GetSetting("Redis", "Port"));
                _eventList = config.GetSetting("Channels", "EventsList");
                _commandChan = config.GetSetting("Channels", "CommandsChannel");

                _heatmapSampleMs = config.ContainsSetting("Features", "HeatmapSampleMs") ? int.Parse(config.GetSetting("Features", "HeatmapSampleMs")) : 5000;
            }
            catch (Exception ex)
            {
                Logger.LogError("[FWAM] Error reading INI config. Using defaults. " + ex.Message);
            }
        }

        public override void DeInitialize()
        {
            Logger.Log("[FWAM Bridge] Shutting down Telemetry Engine...");

            Hooks.OnPlayerConnected -= OnPlayerConnected;
            Hooks.OnPlayerDisconnected -= OnPlayerDisconnected;
            Hooks.OnChat -= OnChat;
            Hooks.OnPlayerHurt -= OnPlayerHurt;
            Hooks.OnPlayerKilled -= OnPlayerKilled;
            Hooks.OnPlayerApproval -= OnPlayerApproval;

            if (_heatmapOn) Hooks.OnPlayerMove -= OnPlayerMove;
            if (_craftingOn) Hooks.OnCrafting -= OnCrafting;
            if (_gatheringOn) Hooks.OnPlayerGathering -= OnPlayerGathering;

            _isRunning = false;
            if (_consumerThread != null && _consumerThread.IsAlive) _consumerThread.Abort();
            if (_receiverThread != null && _receiverThread.IsAlive) _receiverThread.Abort();
        }


        // =========================================================================================
        // PRODUCERS (Custo zero na Main Thread)
        // =========================================================================================

        internal void EnqueueEvent(GameEvent ev)
        {
            lock (_queueLock)
            {
                if (_eventQueue.Count < MAX_QUEUE_SIZE)
                    _eventQueue.Enqueue(ev);
            }
        }

        internal void EnqueueImmediateResponse(string responseType, string uid, string name, string jsonPayload)
        {
            EnqueueEvent(new GameEvent
            {
                Type = "FWAM_Response_" + responseType, // Usado pelo Backend para filtrar que é uma resposta direta a um comando e não um logger
                Timestamp = GetUnixMilli(),
                PlayerUID = uid,
                PlayerName = name,
                Payload = jsonPayload
            });
        }

        /// <summary>
        /// Envia uma resposta direta e imediata para um CorrelationId via PubSub.
        /// </summary>
        public void SendResponse(string correlationId, string payload)
        {
            if (string.IsNullOrEmpty(correlationId)) return;

            string channel = "fwam:responses:" + correlationId;

            // Enviamos em uma nova thread para não bloquear a Main Thread (Loom) com I/O de rede
            Thread t = new Thread(() =>
            {
                RawRedisClient redis = null;
                try
                {
                    redis = new RawRedisClient(_redisHost, _redisPort);
                    redis.Connect();
                    redis.Publish(channel, payload);
                }
                catch (Exception ex)
                {
                    Logger.LogError("[FWAM Response Error] " + ex.Message);
                }
                finally
                {
                    redis?.Dispose();
                }
            })
            {
                IsBackground = true
            };
            t.Start();
        }

        private long GetUnixMilli()
        {
            return (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
        }

        public void OnPlayerConnected(Fougerite.Player player)
        {
            if (player == null) return;
            EnqueueEvent(new GameEvent
            {
                Type = "PlayerConnected",
                Timestamp = GetUnixMilli(),
                PlayerUID = player.SteamID,
                PlayerName = player.Name,
                Payload = string.Format("{{\"ip\": \"{0}\", \"ping\": {1}, \"location\": \"{2},{3},{4}\"}}", player.IP, player.Ping, player.Location.x, player.Location.y, player.Location.z)
            });
        }

        public void OnPlayerDisconnected(Fougerite.Player player)
        {
            if (player == null) return;
            EnqueueEvent(new GameEvent
            {
                Type = "PlayerDisconnected",
                Timestamp = GetUnixMilli(),
                PlayerUID = player.SteamID,
                PlayerName = player.Name,
                Payload = "{}"
            });
        }

        public void OnChat(Fougerite.Player player, ref ChatString message)
        {
            if (player == null) return;
            string safeMsg = message.NewText.Replace("\"", "\\\"");
            EnqueueEvent(new GameEvent
            {
                Type = "Chat",
                Timestamp = GetUnixMilli(),
                PlayerUID = player.SteamID,
                PlayerName = player.Name,
                Payload = string.Format("{{\"message\": \"{0}\"}}", safeMsg)
            });
        }

        public void OnPlayerHurt(HurtEvent he)
        {
            if (he.Victim == null || !(he.Victim is Player)) return;

            Fougerite.Player victim = (Fougerite.Player)he.Victim;
            string attackerName = "Unknown";
            string weapon = he.WeaponName ?? "None";

            if (he.Attacker != null)
            {
                if (he.Attacker is Fougerite.Player) attackerName = ((Fougerite.Player)he.Attacker).Name;
                else if (he.Attacker is Fougerite.Entity) attackerName = ((Fougerite.Entity)he.Attacker).Name;
            }

            EnqueueEvent(new GameEvent
            {
                Type = "PlayerHurt",
                Timestamp = GetUnixMilli(),
                PlayerUID = victim.SteamID,
                PlayerName = victim.Name,
                Payload = string.Format("{{\"damage\": {0}, \"weapon\": \"{1}\", \"attacker\": \"{2}\"}}", he.DamageAmount, weapon, attackerName)
            });
        }

        public void OnPlayerKilled(DeathEvent de)
        {
            if (de.Victim == null || !(de.Victim is Player)) return;

            Fougerite.Player victim = (Fougerite.Player)de.Victim;
            string attackerName = "Environment/Suicide";
            string weapon = de.WeaponName ?? "None";

            if (de.Attacker != null && de.Attacker is Fougerite.Player)
                attackerName = ((Fougerite.Player)de.Attacker).Name;

            EnqueueEvent(new GameEvent
            {
                Type = "PlayerKilled",
                Timestamp = GetUnixMilli(),
                PlayerUID = victim.SteamID,
                PlayerName = victim.Name,
                Payload = string.Format("{{\"attacker\": \"{0}\", \"weapon\": \"{1}\", \"hitbox\": \"Body\"}}", attackerName, weapon)
            });
        }

        // =========================================================================================
        // PRODUCERS ADICIONAIS (FEATURE SET PARTE 4 E DYNAMIC HOOKS)
        // =========================================================================================

        public void SetHeatmapTracking(bool enable)
        {
            if (enable && !_heatmapOn)
            {
                _heatmapOn = true;
                _lastMoveTime.Clear();
                Hooks.OnPlayerMove += OnPlayerMove;
                Logger.Log("[FWAM] Heatmap Tracking ON (Dynamic Hook injected).");
            }
            else if (!enable && _heatmapOn)
            {
                _heatmapOn = false;
                Hooks.OnPlayerMove -= OnPlayerMove;
                _lastMoveTime.Clear();
                Logger.Log("[FWAM] Heatmap Tracking OFF (Dynamic Hook detached).");
            }
        }

        public void SetCraftingTracking(bool enable)
        {
            if (enable && !_craftingOn)
            {
                _craftingOn = true;
                Hooks.OnCrafting += OnCrafting;
                Logger.Log("[FWAM] Crafting Tracking ON.");
            }
            else if (!enable && _craftingOn)
            {
                _craftingOn = false;
                Hooks.OnCrafting -= OnCrafting;
                Logger.Log("[FWAM] Crafting Tracking OFF.");
            }
        }

        public void SetGatheringTracking(bool enable)
        {
            if (enable && !_gatheringOn)
            {
                _gatheringOn = true;
                Hooks.OnPlayerGathering += OnPlayerGathering;
                Logger.Log("[FWAM] Gathering Tracking ON.");
            }
            else if (!enable && _gatheringOn)
            {
                _gatheringOn = false;
                Hooks.OnPlayerGathering -= OnPlayerGathering;
                Logger.Log("[FWAM] Gathering Tracking OFF.");
            }
        }

        public void OnPlayerApproval(PlayerApprovalEvent approvalEvent)
        {
            if (approvalEvent == null) return;
            EnqueueEvent(new GameEvent
            {
                Type = "PlayerApproval",
                Timestamp = GetUnixMilli(),
                PlayerUID = approvalEvent.SteamID.ToString(),
                PlayerName = approvalEvent.Name,
                Payload = string.Format("{{\"ip\": \"{0}\"}}", approvalEvent.IP)
            });
        }

        // Este hook só dispara quando o ASP.NET habilita em realtime (Loom Thread Safe)
        public void OnPlayerMove(HumanController hc, Vector3 origin, int encoded, ushort stateFlags, uLink.NetworkMessageInfo info, Util.PlayerActions action)
        {
            if (hc == null) return;
            Fougerite.Player player = Server.GetServer().FindPlayer(hc.netUser.userID);
            if (player == null) return;

            string uid = player.SteamID;
            long now = GetUnixMilli();

            // Downsampling Lock-free pattern
            long lastT;
            if (_lastMoveTime.TryGetValue(uid, out lastT))
            {
                if ((now - lastT) < _heatmapSampleMs) return; // Droppado pelo sample rate local limitando envios à API
            }
            _lastMoveTime[uid] = now;

            EnqueueEvent(new GameEvent
            {
                Type = "PlayerMoved",
                Timestamp = now,
                PlayerUID = uid,
                PlayerName = player.Name,
                Payload = string.Format("{{\"x\": {0}, \"y\": {1}, \"z\": {2}}}", player.Location.x, player.Location.y, player.Location.z)
            });
        }

        public void OnCrafting(CraftingEvent ce)
        {
            if (ce == null || ce.Player == null) return;
            EnqueueEvent(new GameEvent
            {
                Type = "PlayerCrafting",
                Timestamp = GetUnixMilli(),
                PlayerUID = ce.Player.SteamID,
                PlayerName = ce.Player.Name,
                Payload = string.Format("{{\"item\": \"{0}\", \"amount\": {1}}}", ce.ItemName, ce.Amount)
            });
        }

        public void OnPlayerGathering(Fougerite.Player player, GatherEvent ge)
        {
            if (ge == null || player == null) return;
            EnqueueEvent(new GameEvent
            {
                Type = "PlayerGathering",
                Timestamp = GetUnixMilli(),
                PlayerUID = player.SteamID,
                PlayerName = player.Name,
                Payload = string.Format("{{\"item\": \"{0}\", \"amount\": {1}, \"resource_type\": \"{2}\"}}", ge.Item, ge.Quantity, ge.Type)
            });
        }

        public void OnServerSaved(int amount, double seconds)
        {
            EnqueueEvent(new GameEvent
            {
                Type = "ServerSaved",
                Timestamp = GetUnixMilli(),
                PlayerUID = "SERVER",
                PlayerName = "System",
                Payload = string.Format("{{\"amount\": {0}, \"elapsed_sec\": {1}}}", amount, seconds)
            });
        }


        // =========================================================================================
        // CONSUMER — Drena a fila e envia via LPUSH ao Redis
        // =========================================================================================
        private void ConsumerLoop()
        {
            List<GameEvent> batch = new List<GameEvent>(BATCH_SIZE);

            while (_isRunning)
            {
                RawRedisClient redis = null;
                try
                {
                    redis = new RawRedisClient(_redisHost, _redisPort);
                    redis.Connect();
                    Logger.Log("[FWAM Consumer] Conectado ao Redis na porta " + _redisPort);

                    while (_isRunning)
                    {
                        batch.Clear();
                        lock (_queueLock)
                        {
                            while (_eventQueue.Count > 0 && batch.Count < BATCH_SIZE)
                                batch.Add(_eventQueue.Dequeue());
                        }

                        if (batch.Count > 0)
                        {
                            foreach (var ev in batch)
                            {
                                // Serialização manual — zero dependência Newtonsoft
                                string json = string.Format(
                                    "{{\"Type\":\"{0}\",\"UID\":\"{1}\",\"Name\":\"{2}\",\"Time\":{3},\"Data\":{4}}}",
                                    ev.Type, ev.PlayerUID, ev.PlayerName, ev.Timestamp, ev.Payload);

                                redis.LPush(_eventList, json);
                            }
                        }

                        Thread.Sleep(CONSUMER_SLEEP);
                    }
                }
                catch (ThreadAbortException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Logger.LogDebug("[FWAM Consumer] Erro Redis, retry em 5s: " + ex.Message);
                    Thread.Sleep(RETRY_SLEEP);
                }
                finally
                {
                    if (redis != null) redis.Dispose();
                }
            }
        }


        // =========================================================================================
        // COMMAND RECEIVER — Ouve fwam:commands via SUBSCRIBE bloqueante
        // =========================================================================================
        private void ReceiverLoop()
        {
            while (_isRunning)
            {
                RawRedisClient redis = null;
                try
                {
                    redis = new RawRedisClient(_redisHost, _redisPort);
                    redis.Connect();
                    Logger.Log("[FWAM Receiver] Inscrito em " + _commandChan);

                    redis.SubscribeAndBlock(_commandChan, OnCommandReceived, () => _isRunning);
                }
                catch (ThreadAbortException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Logger.LogDebug("[FWAM Receiver] Erro PubSub, retry em 5s: " + ex.Message);
                    Thread.Sleep(RETRY_SLEEP);
                }
                finally
                {
                    if (redis != null) redis.Dispose();
                }
            }
        }

        private void OnCommandReceived(string channel, string msg)
        {
            try
            {
                string action, target, arg, correlationId = "";

                if (msg.StartsWith("{"))
                {
                    // Formato JSON (Novo)
                    action = SimpleJson.GetValue(msg, "Action") ?? "";
                    target = SimpleJson.GetValue(msg, "Target") ?? "";
                    arg = SimpleJson.GetValue(msg, "Arg") ?? "";
                    correlationId = SimpleJson.GetValue(msg, "CorrelationId") ?? "";
                }
                else
                {
                    // Formato legacy: COMMAND|TARGET|ARG1
                    string[] pData = msg.Split('|');
                    action = pData[0].ToUpper();
                    target = pData.Length > 1 ? pData[1] : "";
                    arg = pData.Length > 2 ? pData[2] : "";
                }

                if (string.IsNullOrEmpty(action)) return;

                Logger.LogDebug("[FWAM COMMAND] Recebido: " + action + (string.IsNullOrEmpty(correlationId) ? "" : " [ID:" + correlationId + "]"));

                // Despacha para a Main Thread do servidor (Loom)
                Loom.QueueOnMainThread(() => ExecuteGameCommand(action, target, arg, correlationId));
            }
            catch (Exception ex)
            {
                Logger.LogError("[FWAM Parse Error] " + ex.Message);
            }
        }


        // =========================================================================================
        // DISPATCHER DA MAIN THREAD (Rust Engine)
        // =========================================================================================
        private void ExecuteGameCommand(string action, string targetId, string arg, string correlationId)
        {
            CommandsHandler.Execute(action, targetId, arg, correlationId, this);
        }
    }

    // =========================================================================================
    // HELPER JSON MINIMALISTA (compatível .NET 3.5 / Mono 2.6)
    // =========================================================================================
    public static class SimpleJson
    {
        public static string GetValue(string json, string key)
        {
            try
            {
                string pattern = "\"" + key + "\":";
                int index = json.IndexOf(pattern);
                if (index == -1) return null;

                int start = index + pattern.Length;
                while (start < json.Length && (char.IsWhiteSpace(json[start]) || json[start] == ':')) start++;

                if (start >= json.Length) return null;

                if (json[start] == '"')
                {
                    start++;
                    int end = json.IndexOf('"', start);
                    if (end == -1) return null;
                    return json.Substring(start, end - start);
                }
                else
                {
                    int end = start;
                    while (end < json.Length && !char.IsWhiteSpace(json[end]) && json[end] != ',' && json[end] != '}') end++;
                    return json.Substring(start, end - start);
                }
            }
            catch { return null; }
        }
    }
}
