using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class DsClearTableCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            DataStore.GetInstance().Flush(targetId);
        }
    }
}
