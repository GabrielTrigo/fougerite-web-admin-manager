using System.Text.Json.Serialization;

namespace Fwam.Backend.Models
{
    public class SummaryViewModel
    {
        [JsonPropertyName("telemetry")]
        public ServerTelemetry? Telemetry { get; set; }

        [JsonPropertyName("onlinePlayers")]
        public int OnlinePlayers { get; set; }

        [JsonPropertyName("eventsToday")]
        public int EventsToday { get; set; }

        [JsonPropertyName("playerCountHistory")]
        public List<AnalyticsPoint> PlayerCountHistory { get; set; } = new();

        [JsonPropertyName("recentEvents")]
        public List<GameEvent> RecentEvents { get; set; } = new();
    }

    public class AnalyticsPoint
    {
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("value")]
        public int Value { get; set; }
    }
}
