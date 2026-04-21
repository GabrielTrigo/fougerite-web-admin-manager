namespace FougeriteAdminBridge.Commands
{
    public class ToggleCraftingCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            bridge.SetCraftingTracking(arg.ToLower() == "true");
        }
    }
}
