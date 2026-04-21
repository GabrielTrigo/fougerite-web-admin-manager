using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class AirdropCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            World.GetWorld().Airdrop();
        }
    }
}
