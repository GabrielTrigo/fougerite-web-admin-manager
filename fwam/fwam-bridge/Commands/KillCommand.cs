using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class KillCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Fougerite.Player killT = Server.GetServer().FindPlayer(targetId);
            killT?.Kill();
        }
    }
}
