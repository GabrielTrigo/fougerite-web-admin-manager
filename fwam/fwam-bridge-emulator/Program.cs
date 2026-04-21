using System;
using System.Threading;

namespace FougeriteAdminBridge.Emulator
{
    internal class Program
    {
        private static string _redisHost = "172.22.179.75";
        private static int _redisPort = 6379;

        private static bool _isRunning = true;
        private static bool _autoHeatmap = false;
        private static bool _autoChat = false;
        private static int _frequencyMs = 5000;

        private static readonly EventSimulator _sim = new EventSimulator();

        static void Main(string[] args)
        {
            Console.Title = "FWAM Bridge Emulator v1.0";
            PrintHeader();

            // 1. Thread de Escuta de Comandos (Pub/Sub)
            Thread receiverThread = new Thread(CommandReceiverLoop)
            {
                IsBackground = true
            };
            receiverThread.Start();

            // 2. Thread de Auto-Eventos
            Thread autoEventThread = new Thread(AutoEventLoop)
            {
                IsBackground = true
            };
            autoEventThread.Start();

            // 3. Menu Principal
            while (_isRunning)
            {
                Console.ForegroundColor = ConsoleColor.White;
                Console.Write("\n[MENU] ");
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("(H) HeatmapToggle | (C) ChatToggle | (S) SendJoin | (D) SendDisconnect | (K) SendKill | (F) Freq | (Q) Quit");
                Console.ResetColor();

                var key = Console.ReadKey(true).Key;

                switch (key)
                {
                    case ConsoleKey.H:
                        _autoHeatmap = !_autoHeatmap;
                        Log(string.Format("Auto-Heatmap: {0}", _autoHeatmap ? "ON" : "OFF"), ConsoleColor.Yellow);
                        break;
                    case ConsoleKey.C:
                        _autoChat = !_autoChat;
                        Log(string.Format("Auto-Chat: {0}", _autoChat ? "ON" : "OFF"), ConsoleColor.Yellow);
                        break;
                    case ConsoleKey.S:
                        var _event = _sim.GenerateJoin();
                        if (_event != null) SendEvent(_event);
                        break;
                    case ConsoleKey.K:
                        SendEvent(_sim.GenerateDeath());
                        break;
                    case ConsoleKey.F:
                        Console.Write("Nova frequência (ms): ");
                        if (int.TryParse(Console.ReadLine(), out int f)) _frequencyMs = f;
                        Log(string.Format("Frequência ajustada para {0}ms", _frequencyMs), ConsoleColor.Magenta);
                        break;
                    case ConsoleKey.D:
                        SendEvent(_sim.GenerateDisconnect());
                        break;
                    case ConsoleKey.Q:
                        _isRunning = false;
                        break;
                }
            }
        }

        private static void CommandReceiverLoop()
        {
            while (_isRunning)
            {
                try
                {
                    using (var redis = new RawRedisClient(_redisHost, _redisPort))
                    {
                        redis.Connect();
                        redis.SubscribeAndBlock("fwam:commands", (chan, msg) =>
                        {
                            try
                            {
                                string action = "", target = "", args = "", correlationId = "";

                                if (msg.StartsWith("{"))
                                {
                                    action = SimpleJson.GetValue(msg, "Action") ?? "";
                                    correlationId = SimpleJson.GetValue(msg, "CorrelationId") ?? "";
                                }
                                else
                                {
                                    action = msg.Split('|')[0].ToUpper();
                                    target = msg.Split('|')[1].ToUpper();
                                    args = msg.Split('|')[2].ToUpper();
                                    correlationId = "";
                                }

                                Log("[COMMAND RECEIVED] " + action + (string.IsNullOrEmpty(correlationId) ? "" : " [ID:" + correlationId + "]"), ConsoleColor.Green);

                                // Lógica de Resposta Mockada
                                if (action == "GET_GAME_ITEMS")
                                {
                                    Log("Solicitação de itens detectada. Gerando resposta...", ConsoleColor.Blue);
                                    string payload = Mocks.GetItemResponseJson();

                                    if (!string.IsNullOrEmpty(correlationId))
                                        SendResponse(correlationId, payload);
                                }
                                else if (action == "SYNC_PLAYERS")
                                {
                                    Log("Solicitação de SINCRONIZAÇÃO detectada. Gerando resposta...", ConsoleColor.Blue);
                                    string payload = _sim.GenerateSync().Data;

                                    if (!string.IsNullOrEmpty(correlationId))
                                        SendResponse(correlationId, payload);
                                }
                                else if (action == "KICK")
                                {
                                    Log("O jogador " + target + " foi kickado do servidor pelo motivo: " + args, ConsoleColor.Red);
                                    SendEvent(_sim.GenerateDisconnect(target));
                                }
                                else if (action == "GET_SERVER_TELEMETRY")
                                {
                                    Log("Solicitação de TELEMETRIA detectada. Enviando resposta." , ConsoleColor.Blue);
                                    SendResponse(correlationId, _sim.GenerateTelemetry());
                                }
                            }
                            catch (Exception ex)
                            {
                                Log("Erro ao processar comando: " + ex.Message, ConsoleColor.Red);
                            }
                        }, () => _isRunning);
                    }
                }
                catch (Exception ex)
                {
                    Log("Erro no Receiver: " + ex.Message, ConsoleColor.DarkRed);
                    Thread.Sleep(5000);
                }
            }
        }

        private static void AutoEventLoop()
        {
            while (_isRunning)
            {
                if (_autoHeatmap) SendEvent(_sim.GenerateMovement());
                if (_autoChat) SendEvent(_sim.GenerateChat());

                Thread.Sleep(_frequencyMs);
            }
        }

        private static void SendEvent(GameEvent ev)
        {
            try
            {
                using (var redis = new RawRedisClient(_redisHost, _redisPort))
                {
                    redis.Connect();
                    string json = ev.ToJson();
                    redis.LPush("fwam:events", json);
                    Log(string.Format("[EVENT SENT] {0} de {1}", ev.Type, ev.Name), ConsoleColor.DarkGray);
                }
            }
            catch (Exception ex)
            {
                Log("Falha ao enviar evento: " + ex.Message, ConsoleColor.DarkRed);
            }
        }

        private static void SendResponse(string correlationId, string payload)
        {
            try
            {
                using (var redis = new RawRedisClient(_redisHost, _redisPort))
                {
                    redis.Connect();
                    string channel = "fwam:responses:" + correlationId;
                    redis.Publish(channel, payload);
                    Log(string.Format("[SYNC REPLY SENT] Channel: {0}", channel), ConsoleColor.Blue);
                }
            }
            catch (Exception ex)
            {
                Log("Falha ao enviar resposta síncrona: " + ex.Message, ConsoleColor.DarkRed);
            }
        }

        private static void Log(string msg, ConsoleColor color)
        {
            Console.ForegroundColor = color;
            Console.WriteLine(string.Format("[{0}] {1}", DateTime.Now.ToString("HH:mm:ss"), msg));
            Console.ResetColor();
        }

        private static void PrintHeader()
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================");
            Console.WriteLine("        FWAM BRIDGE EMULATOR - RUST LEGACY        ");
            Console.WriteLine("==================================================");
            Console.WriteLine("Conectado em: " + _redisHost + ":" + _redisPort);
            Console.WriteLine("Modo: Interatividade Habilitada");
            Console.WriteLine("==================================================");
            Console.ResetColor();
        }
    }

    // =========================================================================================
    // HELPER JSON MINIMALISTA (compatível .NET 3.5)
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
