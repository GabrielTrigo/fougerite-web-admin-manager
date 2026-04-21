using Fwam.Backend.Data;
using Fwam.Backend.Models;
using Fwam.Backend.Services;
using System.Text.Json;

namespace Fwam.Backend.Workers
{
    /// <summary>
    /// Worker Maestro que orquestra a sincronização entre Rust e Web Admin.
    /// Em vez da bridge ter iniciativa, este worker "cutuca" o servidor periodicamente.
    /// </summary>
    public class SyncWorker : BackgroundService
    {
        private readonly ILogger<SyncWorker> _logger;
        private readonly IRedisService _redis;
        private readonly IServiceScopeFactory _scopeFactory;

        public SyncWorker(
            ILogger<SyncWorker> logger,
            IRedisService redis,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _redis = redis;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[FWAM Sync] SyncWorker (Maestro) iniciado.");

            // Dispara as tarefas de sincronização em paralelo com frequências diferentes
            var playersSyncTask = RunPlayersSyncAsync(stoppingToken);
            var telemetrySyncTask = RunTelemetrySyncAsync(stoppingToken);

            await Task.WhenAll(playersSyncTask, telemetrySyncTask);
        }

        private async Task RunPlayersSyncAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("[FWAM Sync] Iniciando reconciliação de players...");
                    var response = await _redis.ExecuteCommandWithResponseAsync("SYNC_PLAYERS", timeoutMs: 10000);

                    if (!string.IsNullOrEmpty(response))
                    {
                        await ProcessSyncResponseAsync(response, stoppingToken);
                    }
                    else
                    {
                        _logger.LogWarning("[FWAM Sync] Bridge não respondeu ao comando de sincronização de players (Timeout).");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[FWAM Sync] Erro no ciclo de sincronização de players.");
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task RunTelemetrySyncAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("[FWAM Telemetry] Solicitando métricas do servidor...");

                    var response = await _redis.ExecuteCommandWithResponseAsync("GET_SERVER_TELEMETRY", timeoutMs: 5000);

                    if (string.IsNullOrEmpty(response))
                    {
                        _logger.LogWarning("[FWAM Telemetry] Bridge não respondeu ao comando de telemetria.");
                    }
                    else
                    {
                        _logger.LogInformation("[FWAM Telemetry] Métricas do servidor recebidas: {Response}", response);

                        try
                        {
                            var telemetry = JsonSerializer.Deserialize<ServerTelemetry>(response);
                            if (telemetry != null)
                            {
                                await _redis.SetServerTelemetryAsync(telemetry);
                                _logger.LogInformation("[FWAM Telemetry] Cache atualizado: {Entities} entidades, Uptime: {Uptime}s",
                                    telemetry.Entities, telemetry.Uptime);
                            }
                        }
                        catch (Exception telEx)
                        {
                            _logger.LogError(telEx, "[FWAM Telemetry] Erro ao processar payload de telemetria.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[FWAM Telemetry] Erro no ciclo de telemetria.");
                }

                // Telemetria é mais leve, podemos rodar a cada 1 minuto
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessSyncResponseAsync(string jsonResponse, CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<FwamDbContext>();

                using var doc = JsonDocument.Parse(jsonResponse);
                var root = doc.RootElement;

                if (!root.TryGetProperty("players", out var playersArray))
                {
                    _logger.LogWarning("[FWAM Sync] Resposta de sincronização inválida (falta propriedade 'players').");
                    return;
                }

                var syncPlayers = playersArray.EnumerateArray()
                    .Select(p => new
                    {
                        Uid = p.GetProperty("uid").GetString()!,
                        Name = p.GetProperty("name").GetString()!
                    })
                    .ToList();

                var onlineUids = syncPlayers.Select(p => p.Uid).ToList();

                // 1. Reconciliação no Banco de Dados
                var allOnlineInDb = context.Players.Where(p => p.IsOnline).ToList();

                // Jogadores fantasma (estão no DB como online, mas não vieram na lista do Rust)
                var ghostPlayers = allOnlineInDb.Where(p => !onlineUids.Contains(p.SteamId));
                foreach (var ghost in ghostPlayers)
                {
                    ghost.IsOnline = false;
                    ghost.UpdatedAt = DateTime.UtcNow;
                    _logger.LogInformation("[FWAM Sync] Corrigindo jogador fantasma: {Name} ({UID})", ghost.Name, ghost.SteamId);
                }

                // Jogadores que estão online no Rust mas offline no DB
                foreach (var syncP in syncPlayers)
                {
                    var player = await context.Players.FindAsync(syncP.Uid);
                    if (player == null)
                    {
                        player = new Models.Entities.Player
                        {
                            SteamId = syncP.Uid,
                            Name = syncP.Name,
                            IsOnline = true,
                            LastConnection = DateTime.UtcNow,
                            AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={syncP.Name}"
                        };
                        context.Players.Add(player);
                    }
                    else
                    {
                        player.IsOnline = true;
                        player.Name = syncP.Name;
                        player.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await context.SaveChangesAsync(stoppingToken);

                // 2. Reconciliação no Redis
                var redisData = syncPlayers.ToDictionary(
                    p => p.Uid,
                    p => JsonSerializer.Serialize(new { Type = "PlayerConnected", UID = p.Uid, Name = p.Name, Time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() })
                );
                await _redis.ReconcileOnlinePlayersAsync(redisData);

                _logger.LogInformation("[FWAM Sync] Sincronização concluída com sucesso. Online: {Count}", onlineUids.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FWAM Sync] Erro ao processar payload de sincronização.");
            }
        }
    }
}
