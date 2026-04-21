using Fougerite;
using System;
using UnityEngine;

namespace FougeriteAdminBridge.Commands
{
    public class GetServerTelemetryCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            try
            {
                double uptime = Time.realtimeSinceStartup;
                string map = "rust_island_2013";

                try
                {
                    // Accessing native convar from Assembly-CSharp
                    if (!string.IsNullOrEmpty(global::server.map))
                    {
                        map = global::server.map;
                    }
                }
                catch
                {
                    // Fallback to command run if field access fails
                    map = "rust_island_2013";
                }

                int entities = World.GetWorld().Entities.Count;
                DateTime lastSave = ServerSaveHandler.LastSaveTime;
                DateTime nextSave = ServerSaveHandler.NextServerSaveTime;
                int plugins = Fougerite.PluginLoaders.PluginLoader.GetInstance().Plugins.Count;
                string version = Fougerite.Bootstrap.Version;

                // Calculate countdown to next save
                double saveCountdown = (nextSave - DateTime.Now).TotalSeconds;
                if (saveCountdown < 0) saveCountdown = 0;

                // Pack into JSON
                // uptime: float, map: string, entities: int, lastSave: iso string, nextSave: iso string, saveCountdown: int, plugins: int, version: string
                string payload = string.Format(
                    "{{\"uptime\":{0:F2},\"map\":\"{1}\",\"entities\":{2},\"lastSave\":\"{3:O}\",\"nextSave\":\"{4:O}\",\"saveCountdown\":{5:F0},\"plugins\":{6},\"version\":\"{7}\"}}",
                    uptime,
                    map,
                    entities,
                    lastSave,
                    nextSave,
                    saveCountdown,
                    plugins,
                    version
                );

                if (!string.IsNullOrEmpty(correlationId))
                {
                    bridge.SendResponse(correlationId, payload);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError("[FWAM Telemetry Error] " + ex.Message);
            }
        }
    }
}
