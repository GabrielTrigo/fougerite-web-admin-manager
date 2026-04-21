namespace FougeriteAdminBridge.Commands
{
    public class ToggleHeatmapCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            bridge.SetHeatmapTracking(arg.ToLower() == "true");
        }
    }
}
