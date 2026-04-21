using Fougerite;
using System;
using System.Collections.Generic;

namespace FougeriteAdminBridge.Commands
{
    public class SyncPlayersCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            try
            {
                var onlinePlayers = Server.GetServer().Players;
                if (onlinePlayers == null)
                {
                    if (!string.IsNullOrEmpty(correlationId))
                    {
                        bridge.SendResponse(correlationId, "{\"players\":[]}");
                    }
                    return;
                }

                List<string> jsonParts = new List<string>();
                foreach (var p in onlinePlayers)
                {
                    if (p == null) continue;
                    jsonParts.Add(string.Format("{{\"uid\":\"{0}\",\"name\":\"{1}\"}}", p.SteamID, p.Name.Replace("\"", "\\\"")));
                }

                string payload = string.Format("{{\"players\":[{0}]}}", string.Join(",", jsonParts.ToArray()));

                if (!string.IsNullOrEmpty(correlationId))
                {
                    bridge.SendResponse(correlationId, payload);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError("[FWAM Sync Command Error] " + ex.Message);
            }
        }
    }
}
