
# Fougerite Web Admin Manager — Arquitetura de Sistema

**Documento:** Design Arquitetural de Alta Performance
**Nivel:** Principal Systems Architect
**Versao:** 1.0 - Abril 2026

---

## Sumario Executivo

Este documento propoe a arquitetura completa de um **Fougerite Web Admin Manager (FWAM)** com foco absoluto em **zero impacto no game loop** e **maxima resiliencia operacional**.

---

## Parte 1 — Analise das Restricoes do Ambiente

### 1.1 Restricoes Identificadas no Codebase

| Componente | Restricao Critica | Impacto Arquitetural |
|---|---|---|
| Loom.Update() | Drena a fila a cada frame (~60x/s); lock(_actions) no main thread | Qualquer bloqueio aumenta duracao do frame |
| Loom.maxThreads = 30 | Hard cap de 30 threads no pool | HTTP server embutido consumiria threads do mesmo pool |
| Bootstrap.CurrentThread | Referencia estatica a main thread do Mono/Unity | Game loop single-threaded; sem paralelismo nativo |
| Newtonsoft.Json | Ja presente no processo | Serializacao JSON sem custo adicional de dependencia |
| SQLiteConnector | SQLite ja esta em uso no processo | Nao usar pela camada de admin (conflito de arquivo DB) |
| ServerSaveHandler | Background thread dedicado com CrucialSavePoint | Modelo de background thread ja validado e seguro |
| DataStore com ReaderWriterLock | Leitura thread-safe; escrita exclusive-lock | Pode ser lido de threads secundarias para snapshot |

### 1.2 Conclusao

**Principio fundamental:** O processo do servidor Rust/Fougerite e soberano e intocavel. A camada de administracao NUNCA deve rodar no mesmo processo OS do servidor de jogo.

Qualquer abordagem in-process introduz riscos inaceitaveis:
- Consumo de threads do pool compartilhado com Loom
- Crash da thread HTTP derrubando o processo inteiro (GC compartilhado no Mono)
- Bloqueios de I/O no main thread em momentos de alta carga
- Impossibilidade de reiniciar a camada de admin sem reiniciar o jogo

---

## Parte 2 — Avaliacao dos Padroes de Comunicacao

### Matriz de Decisao

| Padrao | Isolamento | Overhead | Latencia | Thread Safety | Viabilidade Mono |
|---|---|---|---|---|---|
| REST polling | Total | Medio | Alta | Seguro | Sim |
| WebSockets | Total | Medio | Baixa | Seguro | Sim |
| Shared Memory | Parcial | Zero | Ultra-baixa | Critico | Complexo |
| Named Pipes | Total (localhost) | Baixo | Muito baixa | Seguro | .NET nativo |
| Redis Streams | Total | Baixo | Muito baixa | Seguro | ServiceStack.Redis v3 |
| gRPC | Total | Minimo | Ultra-baixa | Seguro | Mono: grpc-core apenas |
| SignalR in-process | Compartilhado | Medio | Baixa | Risco | Inadmissivel |

### 2.1 Descarte de Opcoes

**Shared Memory:** Eliminado. Requer unsafe code e MemoryMappedFile com semaforos. Race condition fatal para o servidor.

**gRPC:** Eliminado no lado Fougerite. grpc-dotnet requer .NET 5+. grpc-core nativo introduz DLL C++ no processo — risco de crash inaceitavel.

**SignalR in-process:** Eliminado. Rodar Kestrel dentro do processo Mono do Rust e padrao de risco extremo.

**REST puro:** Eliminado como canal principal. Polling incompativel com tempo-real. Usado apenas para CRUD de baixa frequencia.

### 2.2 Finalistas

**Finalista A — Named Pipes (IPC Local)**
- Zero latencia de rede; pipe localhost de alta velocidade
- Suporte nativo via System.IO.Pipes no .NET Framework
- Sem dependencias externas
- Limitacao critica: vincula API e jogo a mesma maquina. Impossibilita separacao cloud.

**Finalista B — Redis Streams (Message Queue)**
- Separacao total de processos e maquinas
- Durabilidade de eventos (replay capability)
- Consumer Groups nativos (API + analytics)
- Pub/Sub com latencia sub-milissegundo
- ServiceStack.Redis v3 compativel com .NET Framework e Mono
- Escalonamento horizontal (multiplos servidores -> uma API central)

### 2.3 Decisao: Redis Streams + WebSocket Hibrido

```
Canal de Eventos (Game -> API):  Redis Streams
Canal de Comandos (API -> Game): Redis Pub/Sub
Canal de UI (API -> Browser):    WebSocket (SignalR Hub)
Canal de CRUD (Browser -> API):  REST/JSON
```

Por que Redis Streams e nao Named Pipes?
Resiliencia operacional. Com Named Pipes, reiniciar a API perde eventos. Com Redis Streams, o plugin escreve independentemente — a API pode reiniciar ou crashar sem perder um evento. O servidor de jogo nao sabe se a API esta online.

---

## Parte 3 — Arquitetura Interna do Plugin (Producer-Consumer)

### 3.1 Padrao: Lock-Free Producer / Asynchronous Consumer

```
PROCESSO DO SERVIDOR RUST LEGACY
─────────────────────────────────────────────────────────────

MAIN THREAD (Unity Game Loop)
  On_PlayerConnected ──┐
  On_Chat              ├──> ConcurrentQueue<GameEvent>.Enqueue()
  On_PlayerHurt        │    (lock-free — Interlocked internamente)
  On_EntityDeployed ───┘
  [Custo adicionado ao frame: < 1 microsegundo]

BACKGROUND THREAD #1 — EventConsumerThread (Priority.BelowNormal)
  - SpinWait + drain da ConcurrentQueue
  - Agrupa ate 50 eventos por batch
  - Serializa com Newtonsoft.Json (ja no processo)
  - XADD fwam:events via ServiceStack.Redis v3
  - Fallback: arquivo JSONL local se Redis offline

BACKGROUND THREAD #2 — CommandReceiverThread
  - Subscreve Redis channel "fwam:commands"
  - Deserializa AdminCommand
  - Loom.QueueOnMainThread(() => ExecuteCommand())
    -> Kick, Ban, Teleport, Broadcast, Airdrop, etc.

NOTA: Ambas as threads sao Thread explicitas (new Thread()),
NAO usam o ThreadPool do Loom.
─────────────────────────────────────────────────────────────
```

### 3.2 Estrutura do GameEvent

```csharp
// struct (nao class) — minimiza pressao no GC do Mono
public struct GameEvent
{
    public string Type;       // "PlayerConnected", "Chat", "PlayerHurt", ...
    public long   Timestamp;  // UnixTimeMilliseconds — evita boxing do DateTime
    public string PlayerUID;  // ulong como string para compatibilidade JSON
    public string PlayerName;
    public string Payload;    // JSON pre-serializado do payload especifico
}
```

### 3.3 Garantia de Zero Bloqueio da Main Thread

```csharp
private void On_PlayerHurt(HurtEvent evt)
{
    // ConcurrentQueue.Enqueue é lock-free (Interlocked internamente)
    _eventQueue.Enqueue(new GameEvent
    {
        Type      = "PlayerHurt",
        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        PlayerUID = evt.VictimPlayer?.UID.ToString() ?? "0",
        Payload   = null  // serializado pelo consumer thread
    });
    // Tempo consumido no main thread: < 500ns
}
```

### 3.4 Backpressure

Se a ConcurrentQueue ultrapassar 10.000 eventos:
1. Eventos de baixa prioridade (On_PlayerMove, On_AnimalMovement) sao descartados
2. Alerta emitido via Redis para o dashboard
3. O servidor de jogo **nunca bloqueia**

### 3.5 Fallback Offline

Se Redis estiver indisponivel, o consumer persiste eventos em JSONL rotacionado por dia.
Ao reconectar, um ReplayWorker envia os eventos em lote. Audit logs nunca sao perdidos.

---

## Parte 4 — Feature Set Completo

### 4.1 Gestao (Management)

| Feature | API Fougerite | Tipo |
|---|---|---|
| Lista de jogadores online com Ping/Localizacao | Server.Players, Player.Ping, Player.Location | Real-time (WebSocket) |
| Kick com razao | Player.Kick() | Comando -> Loom |
| Ban IP + SteamID | Server.BanPlayerIPandID() | Comando -> Loom |
| Unban por ID/IP/Nome | Server.UnbanByID/IP/Name() | Comando -> Loom |
| Teleporte de jogador | Player.TeleportTo() | Comando -> Loom |
| Dar itens | Player.Inventory.AddItem() | Comando -> Loom |
| Broadcast / Notice | Server.Broadcast() / BroadcastNotice() | Comando -> Loom |
| Console command inject | Server.RunServerCommand() | Comando -> Loom |
| Gerenciar sleepers | Server.Sleepers, Sleeper.Kill() | Read + Comando |
| Save manual | Server.Save() | Comando -> Loom |
| Airdrop por coordenada ou jogador | World.AirdropAtOriginal() | Comando -> Loom |
| Reload/Unload de plugins | Via console command | Comando -> Loom |
| Visualizacao do DataStore | DataStore.GetTableNames(), GetTable() | REST snapshot |
| Edicao do DataStore | DataStore.Add() / Remove() | Comando -> Loom |

### 4.2 Seguranca (Security)

| Feature | Implementacao |
|---|---|
| Monitor de flood de conexoes | On_PlayerApproval + rate tracking Redis |
| Deteccao de craft hack | Bootstrap.AutoBanCraft + stream On_Crafting |
| Auditoria de bans | On_PlayerBan -> Redis Stream -> SQLite |
| Blacklist de IP | On_PlayerApproval + DataStore + toggle UI |
| Alertas de comportamento suspeito | Regras: X kills em Y segundos, itens >Z |
| Log de comandos de console | On_ConsoleWithCancel stream completo |
| Historico de sessoes | On_PlayerConnected/Disconnected -> SQLite |
| Visualizacao de ban list | REST -> leitura BanList Fougerite |
| Autenticacao 2FA para admins | TOTP (Google Authenticator) via backend |
| Audit trail de acoes admin | Toda acao administrativa com autor + timestamp |

### 4.3 Automacao (Automation)

| Feature | Implementacao |
|---|---|
| Scheduled restarts | Hangfire cron -> aviso 10/5/1min -> restart command |
| Scheduled airdrops | Hangfire -> XPUBLISH fwam:commands -> World.AirdropAtOriginal() |
| Auto-ban por regra | Motor de regras: IF kills > 20 AND time < 60s THEN ban |
| Auto-broadcast rotativo | Hangfire + lista de mensagens configuravel |
| Auto-kick por ping alto | Monitor Player.Ping + threshold configuravel |
| Wipe agendado | Pipeline: stop server -> delete save files -> restart |
| Notificacoes Discord/Webhook | Backend consume stream + HTTP POST webhook |
| Respostas automaticas | Regra: IF command == "!report" THEN notify_discord() |

### 4.4 Analytics e Observabilidade

| Feature | Fonte | Visualizacao |
|---|---|---|
| Player count historico | On_PlayerConnected/Disconnected -> TimescaleDB | Line chart |
| Mapa de calor de posicoes | On_PlayerMove (sample configuravel) | Heatmap 2D |
| Kill feed em tempo real | On_PlayerKilled -> WebSocket | Live ticker |
| Top players por kills/tempo | Aggregation de DeathEvent | Leaderboard |
| Taxa de gather por recurso | On_PlayerGathering | Bar chart |
| Timeline de airdrops | On_Airdrop / On_AirdropCrateDropped | Timeline |
| Taxa de crafting por item | On_Crafting por DataBlock.Name | Pie chart |
| Performance do save | On_ServerSaved(count, elapsedSecs) | Gauge + historico |
| Plugin error tracking | Logger stream capturado | Alert list |
| Distribuicao de dano por arma | HurtEvent.WeaponName agregado | Radar chart |

---

## Parte 5 — Arquitetura Completa do Sistema

### 5.1 Diagrama de Componentes

```
MAQUINA DO SERVIDOR
──────────────────────────────────────────────────────────────────────

PROCESSO RUST LEGACY (Mono / Unity 3 / .NET Framework 4.x)
  FougeriteAdminBridge.dll (Module C#)
    Producer: ConcurrentQueue<GameEvent>
    Consumer: EventConsumerThread  ────> Redis 7 (fwam:events)
    Receiver: CommandReceiverThread <──  Redis 7 (fwam:commands)

REDIS 7 (bind 127.0.0.1)
  Stream: fwam:events      <- produzido pelo plugin
  Stream: fwam:commands    <- consumido pelo plugin
  Hash:   fwam:state       <- estado online dos jogadores
  Pub:    fwam:alerts      <- alertas de seguranca

PROCESSO FWAM API (ASP.NET Core 8 — servico OS separado)
  REST Controllers (CRUD)
  SignalR Hubs (WebSocket)
  Redis Consumer Group (EventProcessor background service)
  Hangfire Server (Automation)
  SQLite                        <- analytics e audit local
  Redis (state cache)           <- estado real-time

INTERNET (TLS 1.3 via Nginx)
  Angular 17 SPA (browser do administrador)
    - REST para CRUD
    - WebSocket (SignalR) para real-time
    - JWT auth + RBAC
──────────────────────────────────────────────────────────────────────
```

### 5.2 Fluxo de Evento End-to-End

```
[1] Jogador envia mensagem de chat no Rust
[2] Main Thread: Hooks.On_Chat() -> ConcurrentQueue.Enqueue() -> < 1 microsegundo
[3] Main thread retorna AO JOGO imediatamente
[4] EventConsumerThread: drena batch de 50 eventos, serializa, XADD Redis
[5] Redis recebe o evento (~0.1ms latencia IPC local)
[6] EventProcessor: XREADGROUP -> SQLite + SignalR Hub
[7] Angular recebe via WebSocket (latencia total: ~2–5ms)
[8] UI exibe no live chat feed do dashboard
```

---

## Parte 6 — Stack Tecnologico

### 6.1 Plugin Fougerite (Game-Side)

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Plugin base | C# Module (Module class) | Acesso total a hooks; compilado; maxima performance |
| Redis client | ServiceStack.Redis v3 | Unica lib Redis madura compativel com .NET Fx 4.x e Mono |
| Serializacao | Newtonsoft.Json (ja presente) | Zero dependencia adicional |
| Queue interna | ConcurrentQueue<T> (.NET BCL) | Lock-free; sem dependencia externa |
| Thread management | new Thread() explicito | NAO usa ThreadPool do Loom; zero competicao de recursos |

### 6.2 Backend API

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Runtime | ASP.NET Core 8 LTS | Kestrel; alta performance; out-of-process do jogo |
| Real-time | ASP.NET Core SignalR | WebSocket com fallback; integracao nativa Angular |
| Redis client | ServiceStack.Redis v3 | Mesma lib dos dois lados; comportamento consistente |
| ORM | EF Core 8 + Repositorios | Code-first; migrations; suporte TimescaleDB |
| Auth | ASP.NET Core Identity + JWT | RBAC; refresh token; 2FA via TOTP |
| Validacao | FluentValidation | Payloads de comando expressivos e seguros |
| Automacao | Hangfire + SQLite backend | Cron jobs persistentes; UI de monitoramento embutida |
| Rate limiting | ASP.NET Core Rate Limiting built-in | Protecao contra abuso da API de comandos |

### 6.3 Persistencia

| Componente | Tecnologia | Uso |
|---|---|---|
| Database principal | SQLite | Audit log, sessoes, bans historicos, configuracoes |
| Extensao time-series | TimescaleDB | Player count, kill metrics; 10–100x mais rapido que PG puro |
| Cache operacional | Redis 7 | Estado online, comandos pendentes, rate limiting |
| Fallback offline | JSONL rotacionado por dia | Resiliencia quando Redis indisponivel |

### 6.4 Frontend Angular

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Framework | Angular 17 (standalone components) | Signal-based reactivity; bundles menores; sem NgModules |
| UI Library | PrimeNG 17 | Suite completa; tema dark nativo; tabelas e forms integrados |
| Charts | ApexCharts (ngx-apexcharts) | Melhor suporte a series temporais e heatmaps que Chart.js |
| Real-time | @microsoft/signalr (npm) | Cliente oficial; reconexao automatica; tipos TypeScript nativos |
| State | Angular Signals + RxJS | Sem NgRx overhead; signals para estado local |
| Auth | JWT Interceptor + HttpOnly cookie | Token em memoria; refresh seguro; sem localStorage |
| Build | esbuild (padrao Angular 17) | Bundles 2–5x mais rapidos que webpack |

---

## Parte 7 — Seguranca e Operacoes

### 7.1 Superficie de Ataque e Mitigacoes

| Vetor | Mitigacao |
|---|---|
| Redis exposto na rede | bind 127.0.0.1; requirepass; TLS opcional via stunnel |
| API sem TLS | Nginx reverse proxy; SSL termination; HSTS |
| JWT sem expiracao curta | Access token: 15min; Refresh: 7 dias; HttpOnly cookie |
| Injecao via comandos | Allowlist de comandos; validacao estrita de parametros |
| Credentials do admin | bcrypt; rate limiting em login; 2FA obrigatorio |
| Command replay attack | Idempotency key por comando; TTL no Redis |

### 7.2 Configuracao Redis Minima para Producao

```
bind 127.0.0.1
requirepass <senha-forte>
maxmemory 256mb
maxmemory-policy allkeys-lru
stream-node-max-entries 1000
```

### 7.3 Garantias de Nao-Interferencia com o Servidor

1. Processo separado: ASP.NET Core e servico OS independente
2. Thread budget isolado: apenas 2 threads dedicadas no plugin, fora do ThreadPool do Loom
3. Backpressure com descarte: eventos de baixa prioridade descartados sob pressao, nunca bloqueando
4. Circuit breaker: Redis timeout 100ms -> modo degradado (log local) sem parar o jogo
5. CPU priority: Thread.Priority.BelowNormal garante preempcao pelo OS

---

## Parte 8 — Diagrama de Deploy

```
[Opcao 1 — Single Machine]
/rust_server/Modules/FougeriteAdminBridge/FougeriteAdminBridge.dll
/etc/systemd/system/redis.service         (bind 127.0.0.1)
/etc/systemd/system/fwam-api.service      (ASP.NET Core 8)
/opt/fwam-api/                            (binario publicado)
/etc/nginx/                               (reverse proxy TLS)

[Opcao 2 — Separacao de Maquinas]
Maquina A: Rust + FougeriteAdminBridge + Redis
Maquina B: ASP.NET Core + SQLite + Nginx
           (Redis acessivel via VPN/rede interna)
```

---

## Tabela de Decisoes Finais

| Decisao | Escolha | Razao |
|---|---|---|
| Isolamento | Out-of-process obrigatorio | Soberania do processo de jogo |
| Comunicacao game->API | Redis Streams | Durabilidade + desacoplamento total |
| Comunicacao API->game | Redis Pub/Sub + Loom dispatch | Nao-bloqueante; thread safety garantido |
| Comunicacao API->browser | SignalR WebSocket | Real-time sem polling |
| Padrao interno | Producer-Consumer lock-free | Zero bloqueio da main thread |
| Analytics | SQLite | Armazenamento local leve para series temporais |
| Cache operacional | Redis 7 | Source of truth para estado online |
| Frontend | Angular 17 + Signals | Reatividade eficiente sem NgRx overhead |
| Autenticacao | JWT 15min + HttpOnly refresh | Seguranca sem degradar UX |
