using Fwam.Backend.Models;
using Fwam.Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fwam.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController(IRedisService redis, ILogger<AdminController> logger, Data.FwamDbContext context) : ControllerBase
    {
        private readonly IRedisService _redis = redis;
        private readonly ILogger<AdminController> _logger = logger;
        private readonly Data.FwamDbContext _context = context;

        /// <summary>
        /// Dispara um comando genérico para o servidor Rust.
        /// </summary>
        [HttpPost("command")]
        public async Task<IActionResult> SendCommand([FromQuery] string action, [FromQuery] string target = "", [FromQuery] string arg = "")
        {
            try
            {
                _logger.LogInformation("[FWAM Admin] Comando solicitado: {Action} -> {Target}", action, target);
                await _redis.PublishCommandAsync(action, target, arg);
                return Ok(new { success = true, message = $"Comando {action} enviado com sucesso." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Solicita e retorna a lista de itens do jogo.
        /// </summary>
        [HttpGet("items")]
        public async Task<IActionResult> GetItems()
        {
            try
            {
                //if already has cached items, return them immediately
                var cachedItems = await _redis.GetCachedItemsAsync();
                if (cachedItems != null && cachedItems.Any()) return Ok(cachedItems);

                // Solicita atualização da lista ao bridge e aguarda resposta síncrona
                var response = await _redis.ExecuteCommandWithResponseAsync("GET_GAME_ITEMS", "FWAM_SERVER", "");

                if (!string.IsNullOrEmpty(response))
                {
                    var result = JsonSerializer.Deserialize<JsonElement>(response);

                    //add items to cache for future requests
                    if (result.TryGetProperty("items", out JsonElement itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
                    {
                        var items = itemsElement.EnumerateArray().Select(i => i.GetString()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                        await _redis.SetCachedItemsAsync(items);

                        return Ok(items);
                    }
                }

                return NotFound(new { success = false, message = "Itens não encontrados." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retorna o histórico recente de eventos (Polling).
        /// </summary>
        [HttpGet("events")]
        public async Task<IActionResult> GetEvents()
        {
            try
            {
                var rawEvents = await _redis.GetEventHistoryAsync();
                var events = rawEvents.Select(e => System.Text.Json.JsonSerializer.Deserialize<Models.GameEvent>(e));
                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Helper para broadcast rápido.
        /// </summary>
        [HttpPost("broadcast")]
        public async Task<IActionResult> Broadcast([FromBody] string message)
        {
            await _redis.PublishCommandAsync("BROADCAST", "", message);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Retorna a lista global de jogadores (Online + Offline) via Banco de Dados com paginação.
        /// </summary>
        [HttpGet("players")]
        public async Task<IActionResult> GetPlayers([FromQuery] int page = 0, [FromQuery] int size = 50, [FromQuery] string? search = null)
        {
            try
            {
                var query = _context.Players.AsNoTracking();

                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(p => p.Name.Contains(searchLower, StringComparison.CurrentCultureIgnoreCase) || p.SteamId.Contains(search));
                }

                var total = await EntityFrameworkQueryableExtensions.CountAsync(query);
                var players = await EntityFrameworkQueryableExtensions.ToListAsync(
                    query.OrderByDescending(p => p.IsOnline)
                         .ThenByDescending(p => p.LastConnection)
                         .Skip(page * size)
                         .Take(size)
                );

                return Ok(new
                {
                    total,
                    page,
                    size,
                    players
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FWAM API] Erro ao buscar lista de jogadores.");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Helper para ban rápido.
        /// </summary>
        [HttpPost("ban/{uid}")]
        public async Task<IActionResult> Ban(string uid, [FromBody] string reason)
        {
            await _redis.PublishCommandAsync("BAN", uid, reason);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Helper para ban rápido.
        /// </summary>
        [HttpPost("kick/{uid}")]
        public async Task<IActionResult> Kick(string uid, [FromBody] string reason)
        {
            await _redis.PublishCommandAsync("KICK", uid, reason);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Retorna um resumo geral do estado do servidor para o dashboard inicial.
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var summary = new SummaryViewModel();

                // 1. Telemetria do Redis
                var telemetryJson = await _redis.GetServerTelemetryAsync();
                if (!string.IsNullOrEmpty(telemetryJson))
                {
                    summary.Telemetry = JsonSerializer.Deserialize<ServerTelemetry>(telemetryJson);
                }

                // 2. Contagem de Jogadores Online (PostgreSQL)
                summary.OnlinePlayers = await _context.Players.CountAsync(p => p.IsOnline);

                // 3. Eventos de Hoje (Desde 00:00 UTC)
                var today = DateTime.UtcNow.Date;
                summary.EventsToday = await _context.EventLogs.CountAsync(e => e.Timestamp >= today);

                // 4. Últimos 20 Eventos Formatados
                var recentLogs = await _context.EventLogs
                    .OrderByDescending(e => e.Timestamp)
                    .Take(20)
                    .ToListAsync();

                summary.RecentEvents = recentLogs.Select(log => {
                    var gameEvent = JsonSerializer.Deserialize<GameEvent>(log.RawData) ?? new GameEvent();
                    gameEvent.Id = log.Id.ToString();
                    return gameEvent;
                }).ToList();

                // 5. Histórico de Contagem de Jogadores (Últimas 24h)
                // Usando uma aproximação baseada em logs de conexão/desconexão
                summary.PlayerCountHistory = await ComputePlayerCountHistoryAsync();

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FWAM API] Erro ao carregar resumo do servidor.");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<List<AnalyticsPoint>> ComputePlayerCountHistoryAsync()
        {
            var now = DateTime.UtcNow;
            var past24h = now.AddHours(-24);

            // Pegamos todos os eventos de conexão/desconexão das últimas 24h
            var events = await _context.EventLogs
                .Where(e => e.Timestamp >= past24h && (e.Type == "PlayerConnected" || e.Type == "PlayerDisconnected"))
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();

            // Pegamos a contagem ATUAL como ponto de partida (Trabalhando de trás para frente)
            int currentCount = await _context.Players.CountAsync(p => p.IsOnline);
            
            var points = new List<AnalyticsPoint>();
            var eventIndex = 0;

            // Criamos 24 pontos (um por hora)
            for (int i = 0; i < 24; i++)
            {
                var hourPoint = now.AddHours(-i);
                
                // Processamos eventos que ocorreram entre a hora atual e a anterior
                while (eventIndex < events.Count && events[eventIndex].Timestamp > hourPoint)
                {
                    var ev = events[eventIndex];
                    if (ev.Type == "PlayerConnected") currentCount--; // Se conectou depois desta hora, ele não estava online antes
                    else if (ev.Type == "PlayerDisconnected") currentCount++; // Se desconectou depois desta hora, ele estava online antes

                    eventIndex++;
                }

                // Garante que não temos player count negativo
                if (currentCount < 0) currentCount = 0;

                points.Add(new AnalyticsPoint
                {
                    Timestamp = new DateTime(hourPoint.Year, hourPoint.Month, hourPoint.Day, hourPoint.Hour, 0, 0, DateTimeKind.Utc),
                    Value = currentCount
                });
            }

            // Inverte para ficar em ordem cronológica (past -> now)
            points.Reverse();
            return points;
        }
    }
}
