using Fougerite;
using System.Linq;

namespace FougeriteAdminBridge.Commands
{
    public class UnbanCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            if (string.IsNullOrEmpty(targetId)) return;

            string foundName = null;

            // 1. Try to find the name associated with this identifier in either table
            if (targetId.Contains(".") && targetId.Split('.').Length == 4)
            {
                foundName = DataStore.GetInstance().Get("Ips", targetId)?.ToString();
            }
            else if (targetId.Length >= 17 && targetId.All(char.IsDigit))
            {
                foundName = DataStore.GetInstance().Get("Ids", targetId)?.ToString();
            }

            Logger.Log("Found name: " + foundName);

            // 2. If we found a name, use the built-in UnbanByName which cleans both IP and ID
            if (!string.IsNullOrEmpty(foundName))
            {
                Server.GetServer().UnbanByName(foundName, "FWAM_ADMIN");
            }
            else
            {
                // 3. Fallback: if no name mapping exists, try direct removal based on format
                if (targetId.Contains(".")) Server.GetServer().UnbanByIP(targetId);
                else if (targetId.All(char.IsDigit)) Server.GetServer().UnbanByID(targetId);
                else Server.GetServer().UnbanByName(targetId, "FWAM_ADMIN");
            }
        }
    }
}
