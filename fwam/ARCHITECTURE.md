# FWAM — Decisões Arquiteturais

> Referência permanente para todas as sessões de implementação.

---

## Princípio Fundamental

O processo do servidor Rust/Fougerite é **soberano e intocável**. O FWAM nunca roda no mesmo processo OS do servidor de jogo.

---

## Padrão de Comunicação — Redis Streams + WebSocket Híbrido

```
Canal de Eventos (Game → API):  Redis Streams (Simulado via Lista)
Canal de Comandos (API → Game): Redis Pub/Sub
Canal de UI (API → Browser):    WebSocket (SignalR Hub)
Canal de CRUD (Browser → API):  REST/JSON
```

**Por que Redis nativo e não Named Pipes ou gRPC?**

- **Named Pipes:** Vincula API e jogo à mesma máquina. Reiniciar a API perde eventos.
- **gRPC:** `grpc-dotnet` requer .NET 5+. `grpc-core` nativo adiciona DLL C++ no processo Mono — alto risco de crash in-game e incompatibilidade.
- **Redis (Raw TCP):** Plugin escreve via Socket independentemente. A API pode reiniciar/crashar sem perder um evento de log. O padrão Pub/Sub é veloz e escalável.

---

## Restrições Identificadas no Codebase Fougerite

| Componente | Restrição | Impacto |
|---|---|---|
| `Loom.maxThreads = 30` | Hard cap no pool | Usos paralelos HTTP derrubariam filas inteiras. |
| `Loom.Update()` com `lock(_actions)` | Executa a 60fps | Qualquer bloqueio nas chamadas = latência no frame. |
| `Unity 3 / Mono 2.6` | Runtime obsoleto | Quebra instâncias de IPv6 ou TCP complexo. Requer TCPRaw nativo. |
| `Newtonsoft.Json` | Removido | O plugin foi otimizado escrevendo strings JSON literais. |
| `SQLiteConnector` | Já em uso | Não usar para admin (conflito de lock com o Core). |

---

## Arquitetura Interna do Plugin (Lock-Free Threading)

```
MAIN THREAD (Unity Game Loop)
  On_PlayerConnected ──┐
  On_Chat             ├──> Queue<GameEvent>.Enqueue()   < 1µs (em Bloco Lock Local)
  On_PlayerHurt       │    
  On_PlayerKilled   ──┘

BACKGROUND THREAD #1 — EventConsumerThread (Priority.BelowNormal)
  - SpinWait + Drain controlada via QueueLock
  - Drena batch limitando pressão no processador
  - Transcreve os atributos para String JSON Interpolada
  - Conecta TCP Puro -> Redis (LPUSH)

BACKGROUND THREAD #2 — CommandReceiverThread
  - Mantém socket ReceiveTimeout em bloqueio total (infinito `0`).
  - Lógica parser String RAW RESP.
  - Ao receber: Usa `Loom.QueueOnMainThread(() => ExecuteGameCommand())`
```

**Detalhe crítico:** As threads são instanciadas exclusivamente pelo `new Thread()` e processam conexões TCP Socket sem bloquear de forma alguma o `ThreadPool` nativo do `Loom`!

---

## GameEvent — Contrato de Dados

```csharp
public struct GameEvent  // struct, não class — zero pressão de desalocação no GC
{
    public string Type;       // "PlayerConnected", "Chat", "PlayerKilled", ...
    public long   Timestamp;  // UnixTimeMilliseconds (evita object boxing DateTime)
    public string PlayerUID;  // String ID.
    public string PlayerName;
    public string Payload;    // JSON embutido com propriedades extras do disparo
}
```

---

## Stack Tecnológico

### Plugin Fougerite (Engine)
| Componente | Tecnologia |
|---|---|
| Plugin C# Base | `Fougerite.Module` nativo. |
| Redis Client | **Custom `RawRedisClient`**: Conexões TCP via Protocolo RESP diretamente implementado usando `System.Net.Sockets.TcpClient` eliminando erros e quebras em Injeção Mono 2.6. |
| Configuração | Leitura nativa gerada: `Fougerite.IniParser` |
| Queue interna | `Queue<T>` acoplada com Objeto Lock estático em memória |

### Backend API
| Componente | Tecnologia |
|---|---|
| Runtime | ASP.NET Core 8 LTS |
| Real-time | ASP.NET Core SignalR |
| ORM | EF Core 8 + repositórios |
| Auth | Identity + JWT Bearer (15min) + HttpOnly refresh (7d) |
| Automação | Hangfire + SQLite backend |
| Rate limiting | ASP.NET Core Rate Limiting (built-in) |

### Frontend UI
| Componente | Tecnologia |
|---|---|
| Framework | Angular 17 (standalone components + signals) |
| UI Library | PrimeNG 17 (tema dark pre-definido) |
| Layout / Utility | TailwindCSS ou PrimeFlex |
| Echarts | ECharts nativo / ApexCharts para visualizações Analytics. |
| Auth | Interceptor HttpOnly via Cookie State Signals |

---

## Segurança

| Vetor | Mitigação |
|---|---|
| Redis exposto | `bind 127.0.0.1`, `requirepass`, sem interface externa. |
| API sem TLS | Nginx reverse proxy + HSTS via Linux. |
| JWT longevidade | Access token 15min, Refresh 7d (HttpOnly secure flag). |
| Command Receiver | A API web filtra e restringe os Admins usando Role Based Authorization. O Receiver apenas aceita as chaves autorizadas do Canal. |

---

## Backpressure e Conexões

- Fila saturada e travamentos -> Thread de Consumo `Sleeps` degradado evitando processamento síncrono.
- O Timeout das recepções do Bridge estão travados no Modo Escuta sem Drop e reiniciadas as conexões se houver intercorrência nativa de Hardware (como loopback caindo).

---

## Deploy

```
Opção 1 — Ambiente de Hardware Misto (Docker + Game VM):
  /rust_server/Modules/FougeriteAdminBridge/FougeriteAdminBridge.dll
  /rust_server/Modules/FougeriteAdminBridge/FWAMBridge.ini (Apontando via VPN)
  [Ambiente Docker Subnet] fwam-api (Web) e redis-server
  
Opção 2 — Single Machine Windows Server (Rust + IIS):
  /rust_server/Modules/FougeriteAdminBridge/FougeriteAdminBridge.dll
  /Sistema/redis.windows.service     (bind 127.0.0.1)
  /IIS/Sites/FwamAPI                 (Web e Backend)
```
