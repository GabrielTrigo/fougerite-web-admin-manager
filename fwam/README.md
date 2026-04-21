# FWAM — Fougerite Web Admin Manager

> Dashboard administrativo moderno para servidores Rust Legacy/Fougerite.

## Estrutura do Projeto

```
fwam/
├── fwam-frontend/        ← Angular 17 SPA (esta fase)
├── fwam-api/             ← ASP.NET Core 8 Web API (fase 2)
├── FougeriteAdminBridge/ ← Plugin C# para Fougerite (fase 3)
├── TASKS.md              ← Tracker de progresso (atualizar a cada sessão)
├── ARCHITECTURE.md       ← Decisões arquiteturais
└── README.md
```

## Stack Tecnológico

### Frontend (Fase atual)
- **Angular 17** — standalone components, signals, esbuild
- **PrimeNG 17** — componentes de UI com tema customizado Rust
- **ApexCharts** — gráficos de analytics (ngx-apexcharts)
- **SignalR Client** — WebSocket para dados em tempo real
- **SCSS** — design system com tokens da identidade visual do Rust

### Backend (Fase 2)
- **ASP.NET Core 8** — REST API + SignalR Hub
- **SQLite** — analytics e audit log local
- **Redis 7** — streams, pub/sub, cache de estado
- **Hangfire** — automação e cron jobs

### Plugin Fougerite (Fase 3)
- **C# Module** — FougeriteAdminBridge.dll
- **StackExchange.Redis** — publicação de eventos e recebimento de comandos
- **Producer-Consumer** — zero bloqueio no game loop via ConcurrentQueue

## Identidade Visual — Rust Legacy

| Token | Valor | Uso |
|---|---|---|
| `--color-bg-base` | `#1c1a17` | Background principal |
| `--color-bg-surface` | `#252219` | Cards, panels |
| `--color-rust` | `#ce6030` | Accent principal |
| `--color-olive` | `#5c6b2f` | Accent secundário |
| `--color-text-primary` | `#c8b99a` | Texto (parchment) |
| `--color-danger` | `#9b2424` | Ações destrutivas |
| `--color-success` | `#3d6b2a` | Status positivo |

**Fontes:** Rajdhani (headers) · Exo 2 (corpo) · Share Tech Mono (console/IDs)

## Início Rápido

```bash
# Pré-requisitos: Node 20+, Angular CLI 17
cd fwam-frontend
npm install
npm run start
# → http://localhost:4200
```

## Progresso

Ver [TASKS.md](./TASKS.md) para o estado atual de implementação.

## Arquitetura Completa

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para as decisões de design do sistema completo (Redis Streams, Producer-Consumer, etc.).
