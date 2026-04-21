using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class KickCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Fougerite.Player vic = Server.GetServer().FindPlayer(targetId);
            if (vic != null)
            {
                vic.Message("You have been kicked by FWAM: " + arg);
                vic.Disconnect(true);
            }
        }
    }
}
