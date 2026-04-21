using Fougerite;

namespace FougeriteAdminBridge.Commands
{
    public class GiveCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            Fougerite.Player giveTarget = Server.GetServer().FindPlayer(targetId);
            if (giveTarget != null && !string.IsNullOrEmpty(arg))
            {
                string[] p = arg.Split(',');
                string item = p[0];
                int am = p.Length > 1 ? int.Parse(p[1]) : 1;
                giveTarget.Inventory.AddItem(item, am);
                giveTarget.InventoryNotice(am.ToString() + " x " + item);
            }
        }
    }
}
