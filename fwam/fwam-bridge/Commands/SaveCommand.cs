using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class SaveCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Server.GetServer().Save();
            Server.GetServer().BroadcastNotice("Server Saved by FWAM!");
        }
    }
}
