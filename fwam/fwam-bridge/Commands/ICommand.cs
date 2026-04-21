namespace FougeriteAdminBridge.Commands
{
    public interface ICommand
    {
        void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge);
    }
}
