using System;

namespace FougeriteAdminBridge.Emulator
{
    public class GameEvent
    {
        public string Type;
        public string UID;
        public string Name;
        public long Time;
        public string Data; // JSON object as string

        public string ToJson()
        {
            return string.Format(
                "{{\"Id\":\"{0}\",\"Type\":\"{1}\",\"UID\":\"{2}\",\"Name\":\"{3}\",\"Time\":{4},\"Data\":{5}}}",
                Guid.NewGuid().ToString(),
                Type, UID, Name, Time, Data ?? "{}"
            );
        }
    }

    public static class Mocks
    {
        public static string GetItemResponseJson()
        {
            return "{\"items\":[\"M4\",\"P250\",\"Shotgun\",\"MP5A4\",\"Bolt Action Rifle\",\"Small Medkit\",\"Large Medkit\",\"Wood Shelter\",\"Metal Door\",\"Leather Vest\",\"Leather Pants\",\"Kevlar Vest\"]}";
        }

        public static string GetPlayerLocationJson(float x, float y, float z)
        {
            return string.Format("{{\"x\":{0},\"y\":{1},\"z\":{2}}}",
                x.ToString().Replace(",", "."),
                y.ToString().Replace(",", "."),
                z.ToString().Replace(",", " ."));
        }

        public static string GetChatJson(string message)
        {
            return string.Format("{{\"message\":\"{0}\"}}", message.Replace("\"", "\\\""));
        }

        public static string GetDeathJson(string attacker, string weapon)
        {
            return string.Format("{{\"attacker\":\"{0}\",\"weapon\":\"{1}\",\"hitbox\":\"Body\"}}", attacker, weapon);
        }

        internal static string GetTelemetryJson()
        {
            return "{\"uptime\":12345.67,\"map\":\"rust_island_2013\",\"entities\":1500,\"lastSave\":\"2024-06-01T12:00:00Z\",\"nextSave\":\"2024-06-01T12:30:00Z\",\"saveCountdown\":1800,\"plugins\":5,\"version\":\"1.0.0\"}";
        }
    }
}
