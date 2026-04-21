using Fougerite;
using System.Linq;

namespace FougeriteAdminBridge.Commands
{
    public class DsGetTablesCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            string[] tables = DataStore.GetInstance().GetTableNames();
            string payload = string.Format("{{\"tables\":[{0}]}}", string.Join(",", tables.Select(t => "\"" + t + "\"").ToArray()));

            if (!string.IsNullOrEmpty(correlationId))
            {
                bridge.SendResponse(correlationId, payload);
            }

            bridge.EnqueueImmediateResponse("DataStoreTables", targetId, "FWAM", payload);
        }
    }
}
