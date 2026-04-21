using System.Text.Json.Serialization;

namespace Fwam.Backend.Models
{
    public class ServerTelemetry
    {
        [JsonPropertyName("uptime")]
        public double Uptime { get; set; }

        [JsonPropertyName("map")]
        public string Map { get; set; } = string.Empty;

        [JsonPropertyName("entities")]
        public int Entities { get; set; }

        [JsonPropertyName("lastSave")]
        public DateTime LastSave { get; set; }

        [JsonPropertyName("nextSave")]
        public DateTime NextSave { get; set; }

        [JsonPropertyName("saveCountdown")]
        public double SaveCountdown { get; set; }

        [JsonPropertyName("plugins")]
        public int Plugins { get; set; }

        [JsonPropertyName("version")]
        public string Version { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
