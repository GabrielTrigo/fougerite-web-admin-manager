using System.Text.Json;
using System.Text.Json.Serialization;

namespace Fwam.Backend.Models
{
    /// <summary>
    /// Modelo que representa um evento vindo do Rust Legacy via FougeriteAdminBridge.
    /// </summary>
    public class GameEvent
    {
        [JsonPropertyName("Id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("Type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("UID")]
        public string UID { get; set; } = string.Empty;

        [JsonPropertyName("Name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("Time")]
        public long Time { get; set; }

        [JsonPropertyName("Data")]
        public JsonElement Data { get; set; } // O Payload JSON vindo da ponte
    }
}
