# Implementation Plan - Server Telemetry Channel

Implement a read-only synchronization channel to fetch and display real-time server telemetry (uptime, map, entities, last save, plugins, version) on the FWAM Dashboard and Topbar.

## Proposed Changes

### 1. Bridge Plugin (Rust Legacy)

#### [MODIFY] [CommandsHandler.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-bridge/CommandsHandler.cs)
- Register the `GET_SERVER_TELEMETRY` command.

#### [NEW] [GetServerTelemetryCommand.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-bridge/Commands/GetServerTelemetryCommand.cs)
- Implement `ICommand` to collect:
    - `uptime`: via `UnityEngine.Time.realtimeSinceStartup`.
    - `map`: via `ConsoleSystem.Run("server.map")`.
    - `entities`: via `Fougerite.World.GetWorld().Entities.Count`.
    - `lastSave`: via `Fougerite.ServerSaveHandler.LastSaveTime`.
    - `nextSave`: via `Fougerite.ServerSaveHandler.NextServerSaveTime`.
    - `plugins`: via `Fougerite.PluginLoaders.PluginLoader.GetInstance().Plugins.Count`.
    - `version`: via `Fougerite.Bootstrap.Version`.
- Pack into JSON and return via the response channel.

---

### 2. Backend (ASP.NET Core)

#### [NEW] [ServerTelemetry.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Models/ServerTelemetry.cs)
- Data model for the telemetry payload.

#### [MODIFY] [SyncWorker.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Workers/SyncWorker.cs)
- Add a periodic call (every 60s) to `GET_SERVER_TELEMETRY`.
- Process the response and store it in Redis cache.

#### [MODIFY] [TelemetriaWorker.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Workers/TelemetriaWorker.cs)
- Add `FWAM_Response_ServerTelemetry` to the real-time event list.
- Handle the response in the processing loop and broadcast via SignalR.

---

### 3. Frontend (Angular)

#### [MODIFY] [models.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/core/models/models.ts)
- Ensure `ServerStatus` matches the telemetry payload structure.

#### [MODIFY] [event.service.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/core/services/event.service.ts)
- Handle the `ServerTelemetry` event.
- Update a new `serverStatus` signal.

#### [MODIFY] [topbar.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/layout/topbar/topbar.ts)
- Inject `EventService`.
- Switch `server` signal from `MockDataService` to `EventService`.

## Verification Plan

### Automated Tests
- Use the **Bridge Emulator** to simulate the `GET_SERVER_TELEMETRY` response and verify the Backend broadcasts it correctly.
- Verify Redis cache updates using `mcp_redis_get`.

### Manual Verification
- Deploy the Bridge to a test Fougerite server.
- Open the FWAM Dashboard.
- Confirm the Topbar shows correct Uptime and Save countdown.
- Confirm the Dashboard shows correct Entity counts and Map name.
