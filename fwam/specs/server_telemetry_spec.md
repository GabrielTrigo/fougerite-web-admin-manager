# Specification: Server Telemetry Channel

## 1. Overview
Implementing a read-only synchronization channel to fetch and display real-time server telemetry from the Fougerite/Rust Legacy server to the FWAM Dashboard and Topbar.

## 2. Requirements
The following data points must be retrieved from the server:
- **Server Uptime**: Duration or initialization status.
- **Map Name**: The currently loaded map (e.g., `rust_island_2013`).
- **Entity Count**: Total number of entities (structures, deployables, etc.) in the world.
- **Last Save**: Timestamp of the most recent server save.
- **Plugin Count**: Number of active plugins loaded.
- **Fougerite Version**: The version of the Fougerite core.

## 3. Architecture & Data Flow (Passive SDD)
The system follows a passive, request-response pattern over Redis:
1.  **Maestro (Backend `SyncWorker`)**: Periodically (e.g., every 1 minute) sends a `GET_SERVER_TELEMETRY` command to the Bridge via Redis Pub/Sub.
2.  **Bridge Plugin**: 
    - Receives the command.
    - Queries Fougerite APIs for the requested data.
    - Packs the data into a JSON response.
    - Returns the response via Redis response channel (using `CorrelationID`).
3.  **Backend (SyncWorker/TelemetriaWorker)**:
    - Receives the JSON response.
    - Updates the telemetry cache in Redis.
    - Broadcasts the update to all connected clients via **SignalR** (EventsHub).
4.  **Frontend (Angular)**:
    - `EventService` listens for telemetry updates.
    - Dashboard and Topbar components reflect the new data.

## 4. Technical Specs

### 4.1 Bridge Command: `GET_SERVER_TELEMETRY`
- **Action**: `GET_SERVER_TELEMETRY`
- **Response Format**:
```json
{
  "uptime": 12345.67,
  "map": "rust_island_2013",
  "entities": 45032,
  "lastSave": "2026-04-13T17:30:00Z",
  "nextSave": "2026-04-13T17:40:00Z",
  "plugins": 12,
  "version": "1.9.2"
}
```

### 4.2 Data Acquisition (Fougerite API)
- **Uptime**: `UnityEngine.Time.realtimeSinceStartup` (seconds since server start).
- **Map**: `ConsoleSystem.Run("server.map", false)` (capture output).
- **Entities**: `Fougerite.World.GetWorld().Entities.Count`.
- **Last Save**: `Fougerite.ServerSaveHandler.LastSaveTime`.
- **Plugins**: `Fougerite.PluginLoaders.PluginLoader.GetInstance().Plugins.Count`.
- **Version**: `Fougerite.Bootstrap.Version`.

### 4.3 Backend Models
- **ServerTelemetry**:
    - `Uptime`: `double`
    - `Map`: `string`
    - `EntityCount`: `int`
    - `LastSave`: `DateTime`
    - `NextSave`: `DateTime`
    - `PluginCount`: `int`
    - `Version`: `string`

### 4.4 Frontend Integration
- **SignalR Topic**: `ReceiveTelemetry`
- **Topbar**: Display Uptime and Entity Count.
- **Dashboard**: Display full telemetry card.

## 5. Security & Constraints
- **Read-Only**: No setters are implemented. This channel is purely for observation.
- **Throttling**: The backend should not request telemetry faster than once every 30 seconds to avoid performance overhead in entity counting.
