using Fougerite;
using System.Linq;

namespace FougeriteAdminBridge.Commands
{
    public class GetGameItemsCommand : ICommand
    {
        public void Execute(string targetId, string arg, string correlationId, FougeriteAdminBridge bridge)
        {
            var allItems = Server.GetServer().Items;
            if (allItems != null)
            {
                string jsonItems = string.Join(",", allItems.Select(i => "\"" + i.name + "\"").ToArray());
                string itemPayload = string.Format("{{\"items\":[{0}]}}", jsonItems);

                // Envia resposta síncrona se houver um correlationId
                if (!string.IsNullOrEmpty(correlationId))
                {
                    bridge.SendResponse(correlationId, itemPayload);
                }

                // Mantém o comportamento de enfileirar como evento para histórico (opcional, mas bom manter)
                bridge.EnqueueImmediateResponse("GameItemList", targetId, "FWAM", itemPayload);
            }
        }
    }
}
