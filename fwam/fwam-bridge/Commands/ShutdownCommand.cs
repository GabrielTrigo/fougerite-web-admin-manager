using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class ShutdownCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Server.GetServer().Broadcast("Server will shutdown instantly by FWAM Core...");
            Server.GetServer().Save();
            Server.GetServer().RunServerCommand("quit");
        }
    }
}
