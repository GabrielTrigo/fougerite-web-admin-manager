using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class BroadcastCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Server.GetServer().BroadcastNotice(arg);
        }
    }
}
