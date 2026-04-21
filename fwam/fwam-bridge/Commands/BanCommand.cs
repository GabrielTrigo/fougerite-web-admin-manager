using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class BanCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Fougerite.Player banTarget = Server.GetServer().FindPlayer(targetId);
            if (banTarget != null)
            {
                Server.GetServer().BanPlayer(banTarget, "FWAM_ADMIN", arg);
            }
        }
    }
}
