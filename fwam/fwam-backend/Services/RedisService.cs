using StackExchange.Redis;
using System.Text.Json;

namespace Fwam.Backend.Services
{
    public interface IRedisService
    {
        Task PublishCommandAsync(string action, string target = "", string arg = "");
        Task<string?> ExecuteCommandWithResponseAsync(string action, string target = "", string arg = "", int timeoutMs = 5000);
        Task<string?> PopEventAsync();
        IDatabase GetDatabase();
        Task AddPlayerToCacheAsync(string uid, string name, object data);
        Task RemovePlayerFromCacheAsync(string uid);
        Task ReconcileOnlinePlayersAsync(IDictionary<string, string> players);
        Task<IEnumerable<string>> GetOnlinePlayersAsync();
        Task AddEventToHistoryAsync(object data);
        Task<IEnumerable<string>> GetEventHistoryAsync();
        Task SetCachedItemsAsync(IEnumerable<string> items);
        Task<IEnumerable<string>> GetCachedItemsAsync();
        Task SetServerTelemetryAsync(object telemetry);
        Task<string?> GetServerTelemetryAsync();
    }

    public class RedisService : IRedisService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly string _commandChannel = "fwam:commands";
        private readonly string _eventList = "fwam:events";
        private readonly string _onlinePlayersKey = "fwam:players:online";
        private readonly string _eventHistoryKey = "fwam:events:history";
        private readonly string _itemsKey = "fwam:items";
        private readonly string _telemetryKey = "fwam:server:telemetry";

        public RedisService(IConfiguration configuration)
        {
            var host = configuration["Redis:Host"] ?? "127.0.0.1";
            var port = configuration["Redis:Port"] ?? "6379";
            _redis = ConnectionMultiplexer.Connect($"{host}:{port}");

            _commandChannel = configuration["Redis:Channels:Commands"] ?? "fwam:commands";
            _eventList = configuration["Redis:Channels:Events"] ?? "fwam:events";
        }

        public IDatabase GetDatabase() => _redis.GetDatabase();

        /// <summary>
        /// Envia um comando para o servidor Rust via PubSub.
        /// Formato legível: ACTION|TARGET|ARG
        /// </summary>
        public async Task PublishCommandAsync(string action, string target = "", string arg = "")
        {
            var db = _redis.GetDatabase();
            var message = $"{action.ToUpper()}|{target}|{arg}";
            await db.PublishAsync(_commandChannel, message);
        }

        /// <summary>
        /// Envia um comando e aguarda a resposta (Request-Reply pattern).
        /// </summary>
        public async Task<string?> ExecuteCommandWithResponseAsync(string action, string target = "", string arg = "", int timeoutMs = 5000)
        {
            var db = _redis.GetDatabase();
            var sub = _redis.GetSubscriber();
            var correlationId = Guid.NewGuid().ToString();
            var responseChannel = $"fwam:responses:{correlationId}";
            var tcs = new TaskCompletionSource<string?>(TaskCreationOptions.RunContinuationsAsynchronously);

            // 1. Se inscreve no canal de resposta
            await sub.SubscribeAsync(responseChannel, (channel, message) =>
            {
                tcs.TrySetResult(message.ToString());
            });

            try
            {
                // 2. Envia o comando em formato JSON para incluir o CorrelationId
                var payload = new
                {
                    Action = action.ToUpper(),
                    Target = target,
                    Arg = arg,
                    CorrelationId = correlationId
                };
                var json = JsonSerializer.Serialize(payload);

                await db.PublishAsync(_commandChannel, json);

                // 3. Aguarda a resposta ou timeout
                var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(timeoutMs));
                if (completedTask == tcs.Task)
                {
                    return await tcs.Task;
                }
                else
                {
                    return null; // Timeout
                }
            }
            finally
            {
                // 4. Limpa subscrição
                await sub.UnsubscribeAsync(responseChannel);
            }
        }

        /// <summary>
        /// Remove e retorna o próximo evento da fila fwam:events (RPOP).
        /// </summary>
        public async Task<string?> PopEventAsync()
        {
            var db = _redis.GetDatabase();

            // Prevent WRONGTYPE errors by checking the key type first.
            var keyType = await db.KeyTypeAsync(_eventList);

            if (keyType == RedisType.List)
            {
                return await db.ListRightPopAsync(_eventList);
            }

            if (keyType == RedisType.String)
            {
                // If someone stored a string at this key, return it and delete the key
                // so future operations won't fail.
                var str = await db.StringGetAsync(_eventList);
                await db.KeyDeleteAsync(_eventList);
                return str.HasValue ? str.ToString() : null;
            }

            // For any other type (hash, set, etc.) or when the key doesn't exist,
            // delete the key to allow recovery and return null.
            if (keyType != RedisType.None)
            {
                await db.KeyDeleteAsync(_eventList);
            }

            return null;
        }

        /// <summary>
        /// Armazena os dados do jogador no Redis para consulta rápida.
        /// </summary>
        public async Task AddPlayerToCacheAsync(string uid, string name, object data)
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(data);
            await db.HashSetAsync(_onlinePlayersKey, uid, json);
        }

        /// <summary>
        /// Remove o jogador do cache do Redis.
        /// </summary>
        public async Task RemovePlayerFromCacheAsync(string uid)
        {
            var db = _redis.GetDatabase();
            await db.HashDeleteAsync(_onlinePlayersKey, uid);
        }

        /// <summary>
        /// Limpa o cache de jogadores online e define a nova lista exata (Batch).
        /// </summary>
        public async Task ReconcileOnlinePlayersAsync(IDictionary<string, string> players)
        {
            var db = _redis.GetDatabase();

            // Deletamos a chave atual para garantir consistência total
            await db.KeyDeleteAsync(_onlinePlayersKey);

            if (players != null && players.Count > 0)
            {
                var entries = players.Select(p => new HashEntry(p.Key, p.Value)).ToArray();
                await db.HashSetAsync(_onlinePlayersKey, entries);
            }
        }

        /// <summary>
        /// Retorna todos os jogadores armazenados no cache do Redis.
        /// </summary>
        public async Task<IEnumerable<string>> GetOnlinePlayersAsync()
        {
            var db = _redis.GetDatabase();
            var values = await db.HashValuesAsync(_onlinePlayersKey);
            return values.Select(v => v.ToString());
        }

        /// <summary>
        /// Adiciona um evento ao histórico circular (últimos 50).
        /// </summary>
        public async Task AddEventToHistoryAsync(object data)
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(data);

            // Adiciona no topo e corta a cauda para manter 50 itens
            await db.ListLeftPushAsync(_eventHistoryKey, json);
            await db.ListTrimAsync(_eventHistoryKey, 0, 49);
        }

        /// <summary>
        /// Retorna o histórico de eventos.
        /// </summary>
        public async Task<IEnumerable<string>> GetEventHistoryAsync()
        {
            var db = _redis.GetDatabase();
            var values = await db.ListRangeAsync(_eventHistoryKey, 0, 49);
            return values.Select(v => v.ToString());
        }

        public async Task SetCachedItemsAsync(IEnumerable<string> items)
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(_itemsKey);
            foreach (var item in items)
            {
                await db.ListRightPushAsync(_itemsKey, item);
            }
        }

        public async Task SetServerTelemetryAsync(object telemetry)
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(telemetry);
            await db.StringSetAsync(_telemetryKey, json, TimeSpan.FromMinutes(5));
        }

        public async Task<string?> GetServerTelemetryAsync()
        {
            var db = _redis.GetDatabase();
            var val = await db.StringGetAsync(_telemetryKey);
            return val.HasValue ? val.ToString() : null;
        }

        public async Task<IEnumerable<string>> GetCachedItemsAsync()
        {
            var db = _redis.GetDatabase();
            var values = await db.ListRangeAsync(_itemsKey, 0, -1);
            return values.Select(v => v.ToString());
        }
    }
}
