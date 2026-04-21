using Microsoft.AspNetCore.SignalR;

namespace Fwam.Backend.Hubs
{
    /// <summary>
    /// Hub do SignalR para transmissão de eventos em tempo real do Rust para o Dashboard.
    /// </summary>
    public class EventsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            // Futuramente pode-se adicionar logs de conexão de admin aqui
        }
    }
}
