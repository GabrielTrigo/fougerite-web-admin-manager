using Fwam.Backend.Hubs;
using Fwam.Backend.Models;
using Fwam.Backend.Services;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace Fwam.Backend.Workers
{
    /// <summary>
    /// Worker em background que drena a fila de eventos do Redis e transmite via SignalR.
    /// Atua como a ponte de dados entre o Rust Legacy e o Web Admin.
    /// </summary>
    public class TelemetriaWorker : BackgroundService
    {
        private readonly ILogger<TelemetriaWorker> _logger;
        private readonly IRedisService _redis;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<EventsHub> _hubContext;

        // Lista de eventos que devem ser disparados via Socket em tempo real
        private static readonly HashSet<string> RealTimeEvents =
        [
            "Chat",
            "PlayerConnected",
            "PlayerDisconnected",
            "PlayerKilled",
            "PlayerHurt",
            "ServerSaved",
            "FWAM_Response_GameItemList",
            "PlayerMoved"
        ];

        public TelemetriaWorker(
            ILogger<TelemetriaWorker> logger,
            IRedisService redis,
            IServiceScopeFactory scopeFactory,
            IHubContext<EventsHub> hubContext)
        {
            _logger = logger;
            _redis = redis;
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[FWAM Backend] TelemetriaWorker iniciado - Transmissão via SignalR Habilitada.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var rawEvent = await _redis.PopEventAsync();

                    if (!string.IsNullOrEmpty(rawEvent))
                    {
                        var gameEvent = JsonSerializer.Deserialize<GameEvent>(rawEvent);

                        if (gameEvent != null)
                        {
                            // Garante que o ID está presente
                            if (string.IsNullOrEmpty(gameEvent.Id)) gameEvent.Id = Guid.NewGuid().ToString();

                            _logger.LogInformation("[FWAM Event] {Type} de {Name}", gameEvent.Type, gameEvent.Name);

                            // 1. Persistência em Banco de Dados (PostgreSQL)
                            try
                            {
                                using var scope = _scopeFactory.CreateScope();
                                var context = scope.ServiceProvider.GetRequiredService<Data.FwamDbContext>();
                                var log = new Models.Entities.GameEventLog
                                {
                                    Id = Guid.Parse(gameEvent.Id),
                                    Type = gameEvent.Type,
                                    PlayerName = gameEvent.Name,
                                    PlayerUID = gameEvent.UID,
                                    Message = ParseMessage(gameEvent),
                                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(gameEvent.Time).UtcDateTime,
                                    RawData = rawEvent
                                };
                                context.EventLogs.Add(log);
                                await context.SaveChangesAsync(stoppingToken);
                            }
                            catch (Exception dbEx)
                            {
                                _logger.LogError(dbEx, "[FWAM Persistence] Erro ao salvar log no banco.");
                            }

                            // 2. Gerencia persistência e cache de jogadores
                            if (gameEvent.Type == "PlayerConnected")
                            {
                                try
                                {
                                    using var scope = _scopeFactory.CreateScope();
                                    var context = scope.ServiceProvider.GetRequiredService<Data.FwamDbContext>();

                                    var player = await context.Players.FindAsync(gameEvent.UID);
                                    if (player == null)
                                    {
                                        player = new Models.Entities.Player
                                        {
                                            SteamId = gameEvent.UID,
                                            Name = gameEvent.Name,
                                            IsOnline = true,
                                            LastConnection = DateTime.UtcNow,
                                            AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={gameEvent.Name}"
                                        };
                                        context.Players.Add(player);
                                    }
                                    else
                                    {
                                        player.Name = gameEvent.Name; // BR02
                                        player.IsOnline = true;
                                        player.LastConnection = DateTime.UtcNow;
                                        player.UpdatedAt = DateTime.UtcNow;
                                    }

                                    if (gameEvent.Data.ValueKind != JsonValueKind.Undefined && gameEvent.Data.TryGetProperty("ip", out var ipProp))
                                    {
                                        player.IpAddress = ipProp.GetString();
                                    }

                                    await context.SaveChangesAsync(stoppingToken);
                                }
                                catch (Exception pEx)
                                {
                                    _logger.LogError(pEx, "[FWAM Players] Erro ao persistir player conectado.");
                                }

                                await _redis.AddPlayerToCacheAsync(gameEvent.UID, gameEvent.Name, gameEvent);
                            }
                            else if (gameEvent.Type == "PlayerDisconnected")
                            {
                                try
                                {
                                    using var scope = _scopeFactory.CreateScope();
                                    var context = scope.ServiceProvider.GetRequiredService<Data.FwamDbContext>();

                                    var player = await context.Players.FindAsync(gameEvent.UID);
                                    if (player != null)
                                    {
                                        player.IsOnline = false;
                                        player.UpdatedAt = DateTime.UtcNow;
                                        await context.SaveChangesAsync(stoppingToken);
                                    }
                                }
                                catch (Exception pEx)
                                {
                                    _logger.LogError(pEx, "[FWAM Players] Erro ao atualizar player desconectado.");
                                }

                                await _redis.RemovePlayerFromCacheAsync(gameEvent.UID);
                            }
                            else if (gameEvent.Type == "FWAM_Response_GameItemList")
                            {
                                try
                                {
                                    var items = gameEvent.Data.GetProperty("items").EnumerateArray()
                                        .Select(i => i.GetString() ?? "")
                                        .Where(s => !string.IsNullOrEmpty(s));
                                    await _redis.SetCachedItemsAsync(items);
                                }
                                catch (Exception itemEx)
                                {
                                    _logger.LogError(itemEx, "[FWAM Items] Erro ao atualizar cache de itens.");
                                }
                            }
                            // 3. Armazena no histórico volátil (Redis)
                            await _redis.AddEventToHistoryAsync(gameEvent);

                            // 4. Transmissão em Tempo Real via SignalR (Apenas lista seleta)
                            if (RealTimeEvents.Contains(gameEvent.Type))
                            {
                                _logger.LogInformation("[FWAM SignalR] Transmitindo evento {Type} de {Name} para clientes conectados.", gameEvent.Type, gameEvent.Name);
                                await _hubContext.Clients.All.SendAsync("ReceiveEvent", gameEvent, stoppingToken);
                            }

                            _logger.LogInformation("[FWAM Event processed] {Type} de {Name}", gameEvent.Type, gameEvent.Name);
                        }
                    }
                    else
                    {
                        await Task.Delay(100, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[FWAM Worker] Erro ao processar evento.");
                    await Task.Delay(2000, stoppingToken);
                }
            }
        }

        private static string? ParseMessage(GameEvent ev)
        {
            try
            {
                if (ev.Type == "Chat") return ev.Data.GetProperty("message").GetString();
                return null;
            }
            catch { return null; }
        }
    }
}
