# Copilot instructions for Fougerite Web Admin Manager

## Build and test commands

### FWAM frontend (`fwam\fwam-frontend`)

```powershell
npm install
npm run start
npm run build
npx ng test --watch=false
npx ng test --include src/app/path/to/file.spec.ts --watch=false
npx ng test --list-tests
```

- The frontend currently has **Vitest wired through Angular's `ng test` builder**, but there are **no checked-in `*.spec.ts` files yet**. `npx ng test --list-tests` currently prints an empty list.
- `npm run build` is active and currently emits a bundle budget warning because the initial bundle is slightly over the configured 500 kB warning threshold.

### FWAM backend (`fwam\fwam-backend`)

```powershell
dotnet build
dotnet run
```

- This project currently targets **`net10.0`** in code, even though the higher-level docs still describe ASP.NET Core 8.
- There is no backend test project checked in.

### Fougerite runtime and FWAM bridge

```powershell
msbuild Fougerite\Fougerite.sln /p:Configuration=SERVER
msbuild fwam\fwam-bridge\FougeriteAdminBridge.csproj /p:Configuration=Release
```

- `Fougerite\README.md` documents the full patcher-first flow when the patched Rust Legacy DLLs need to be regenerated.
- The legacy projects are **.NET Framework 3.5-era MSBuild projects**, not SDK-style `dotnet build` projects.
- `fwam\fwam-bridge\FougeriteAdminBridge.csproj` has a post-build copy step that publishes the DLL into a local Rust Legacy server modules folder.

## High-level architecture

- `Fougerite\` is the legacy Rust server modding platform. It works by **statically patching Rust Legacy assemblies before server start**, then routing game activity through `Hooks` and plugin/module loaders.
- `fwam\fwam-bridge\` is the in-process game bridge loaded by Fougerite. It hooks game events, builds `GameEvent` payloads, pushes them to Redis via a **custom raw RESP/TCP client** (`RawRedisClient`), listens on `fwam:commands`, and marshals command execution back onto the Unity/Fougerite main thread through `Loom.QueueOnMainThread(...)`.
- `fwam\fwam-backend\` is the out-of-process admin API. Today it publishes commands to Redis, polls `fwam:events` from Redis in `TelemetriaWorker`, persists event logs to SQLite via EF Core, and maintains Redis-backed caches for online players, recent events, and item lists. The current code uses **polling REST endpoints**, not SignalR, even though the architecture docs describe SignalR as the intended real-time channel.
- `fwam\fwam-frontend\` is an Angular SPA built with **standalone components, lazy-loaded route components, signals, and PrimeNG in unstyled mode**. The actual live integration point is `EventService`, which polls the backend every 3 seconds. Many screens still read from `MockDataService`, so the UI is partly live-backed and partly mock-backed.

## Key conventions

- The **Redis contract is literal and cross-cutting**:
  - Commands are published as `ACTION|TARGET|ARG`.
  - Bridge events are serialized manually as JSON with PascalCase keys: `Type`, `UID`, `Name`, `Time`, `Data`.
  - If you add a command or event type, update the bridge producer/dispatcher, the backend parser/worker/cache handling, and the frontend mapping code together.
- The bridge must stay compatible with the **old Mono / .NET 3.5 game runtime**. Preserve the current style: dedicated `Thread` instances, no modern runtime assumptions, no external Redis client, and no blocking work on the hook path.
- The frontend follows a consistent Angular structure:
  - standalone components and route-level `loadComponent(...)`
  - `inject(...)` instead of constructor DI in many services/components
  - signals/computed values for local state
  - file names like `pages\dashboard\dashboard.ts` and `layout\sidebar\sidebar.ts` instead of `*.component.ts`
- UI styling is centralized around the **Rust Legacy design system**:
  - global CSS variables in `src\styles.css`
  - PrimeNG pass-through styling in `src\app\core\services\rust-preset.ts`
  - `providePrimeNG({ unstyled: true, pt: RustPreset })` in `app.config.ts`
  - prefer extending these tokens/presets instead of adding ad hoc component-local styling rules
- The current local integration defaults are spread across files and must stay aligned:
  - frontend API base URL is hardcoded in `AdminApiService` (`http://localhost:5259/api/admin`)
  - backend CORS currently allows `http://localhost:4200`
  - backend Redis/SQLite defaults come from `appsettings.json`
  - bridge startup also writes/reads its own `FWAMBridge.ini`
- Treat `fwam\ARCHITECTURE.md`, `fwam\fwam_architecture.md`, `fwam\fwam-frontend\FRONTEND_PLAN.md`, and `fwam\fwam-bridge\BRIDGE_PLAN.md` as important design context, but prefer the current code when versions or implemented capabilities disagree with those documents.
