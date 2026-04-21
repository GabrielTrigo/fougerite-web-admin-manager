using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class ChatCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Server.GetServer().Broadcast(arg);
        }
    }
}
