using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class TeleportCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Fougerite.Player tpTarget = Server.GetServer().FindPlayer(targetId);
            if (tpTarget != null && !string.IsNullOrEmpty(arg))
            {
                string[] coords = arg.Split(',');
                if (coords.Length >= 3)
                {
                    float x = float.Parse(coords[0], System.Globalization.CultureInfo.InvariantCulture);
                    float y = float.Parse(coords[1], System.Globalization.CultureInfo.InvariantCulture);
                    float z = float.Parse(coords[2], System.Globalization.CultureInfo.InvariantCulture);
                    tpTarget.TeleportTo(x, y, z);
                }
                else
                {
                    if (!string.IsNullOrEmpty(correlationId))
                    {
                        bridge.SendResponse(correlationId, "{\"success\": false, \"message\": \"Player not found\"}");
                    }
                }
            }
        }
    }
}
