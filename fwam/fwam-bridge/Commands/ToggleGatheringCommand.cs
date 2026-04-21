namespace FougeriteAdminBridge.Commands
{
    public class ToggleGatheringCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            bridge.SetGatheringTracking(arg.ToLower() == "true");
        }
    }
}
