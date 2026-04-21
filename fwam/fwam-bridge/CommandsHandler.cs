using Fougerite;
using FougeriteAdminBridge.Commands;
using System;
using System.Collections.Generic;

namespace FougeriteAdminBridge
{
    // =========================================================================================
    // COMMANDS HANDLER
    // Delega os comandos recebidos pelo Redis Pub/Sub e aplica na engine do Rust (Loom.MainThread)
    // =========================================================================================
    public static class CommandsHandler
    {
        private static readonly Dictionary<string, ICommand> _commands = new Dictionary<string, ICommand>();

        static CommandsHandler()
        {
            // Management
            _commands["BROADCAST"] = new BroadcastCommand();
            _commands["CHAT"] = new ChatCommand();
            _commands["KICK"] = new KickCommand();
            _commands["BAN"] = new BanCommand();
            _commands["UNBAN"] = new UnbanCommand();

            // Player Control
            _commands["TELEPORT"] = new TeleportCommand();
            _commands["GIVE"] = new GiveCommand();
            _commands["KILL"] = new KillCommand();

            // Server Control
            _commands["SHUTDOWN"] = new ShutdownCommand();
            _commands["SAVE"] = new SaveCommand();
            _commands["AIRDROP"] = new AirdropCommand();

            // System / Data
            _commands["GET_GAME_ITEMS"] = new GetGameItemsCommand();
            _commands["DS_GET_TABLES"] = new DsGetTablesCommand();
            _commands["DS_CLEAR_TABLE"] = new DsClearTableCommand();

            // Dynamic Hooks
            _commands["TOGGLE_HEATMAP"] = new ToggleHeatmapCommand();
            _commands["TOGGLE_CRAFTING"] = new ToggleCraftingCommand();
            _commands["TOGGLE_GATHERING"] = new ToggleGatheringCommand();

            // Sincronização Passiva
            _commands["SYNC_PLAYERS"] = new SyncPlayersCommand();
            _commands["GET_SERVER_TELEMETRY"] = new GetServerTelemetryCommand();
        }

        public static void Execute(string action, string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            try
            {
                if (_commands.ContainsKey(action))
                {
                    _commands[action].Execute(targetId, arg, correlationId, bridge);
                }
                else
                {
                    Logger.LogDebug("[FWAM Dispatcher] Unrecognized Action: " + action + (string.IsNullOrEmpty(correlationId) ? "" : " [ID:" + correlationId + "]"));
                }
            }
            catch (Exception ex)
            {
                Logger.LogError("[FWAM Dispatcher] Error parsing " + action + " - " + ex.Message);
            }
        }
    }
}
