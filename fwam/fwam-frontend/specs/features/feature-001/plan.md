# Implementation Plan - Feature-001: Global Player Persistence

Allow administrators to view all players who have ever connected to the server, including their current connectivity status (Online/Offline), by persisting player metadata in the database and mirroring it in Redis.

## User Review Required

> [!IMPORTANT]
> **Database Migration**: This feature introduces a new `Players` table. The backend will use `context.Database.EnsureCreated()` (existing pattern in `Program.cs`), but in a production environment, explicit migrations would be preferred.
> **SignalR Performance**: With a global player list, we will continue to use SignalR to push "Status" updates. The frontend will need to efficiently handle status toggling for players who are already in the list to avoid full-table re-renders.

## Proposed Changes

---

### Backend Components

#### [NEW] [Player.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Models/Entities/Player.cs)
- Create a new entity to represent a player.
- **Fields**: `SteamId` (Key), `Name`, `IsOnline`, `LastConnection`, `AvatarUrl`, `IpAddress`.

#### [MODIFY] [FwamDbContext.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Data/FwamDbContext.cs)
- Register the `Players` DbSet.
- Add an index on `IsOnline` for faster filtering.

#### [MODIFY] [TelemetriaWorker.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Workers/TelemetriaWorker.cs)
- Update connection event handling:
    - **PlayerConnected**: Perform an "Upsert" in the DB. Update status to `true`, update name if changed (BR02).
    - **PlayerDisconnected**: Update DB status to `false`.
- Ensure Redis cache reflects these changes to satisfy BR04 (caching for performance).

#### [MODIFY] [AdminController.cs](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-backend/Controllers/AdminController.cs)
- Refactor `GetPlayers` endpoint:
    - Fetch from the `Players` table instead of the volatile Redis set.
    - Implement simple pagination and search filter support (RF04/Open Questions).

---

### Frontend Components

#### [MODIFY] [admin-api.service.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/core/services/admin-api.service.ts)
- Update `getOnlinePlayers()` to a more generic `getPlayers(page, size, search)`.

#### [MODIFY] [event.service.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/core/services/event.service.ts)
- Add a new signal `globalPlayers` to handle the full list.
- Update `handleNewEvent`:
    - On `PlayerConnected/Disconnected`, update the `isConnected` status of the player in the `globalPlayers` signal instead of adding/removing from a list.

#### [MODIFY] [players.ts](file:///f:/temp/Fougerite%20Web%20Admin%20Manager/fwam/fwam-frontend/src/app/pages/players/players.ts)
- Rename header to "Player Management" or "Connection History".
- Update the PrimeNG table to handle pagination via the API.
- Ensure the status column correctly renders the "Offline" tag for disconnected players (already partially implemented with opacity, but needs better visual tags).

## Open Questions

- **Pagination Sensitivity**: Should we implement "Infinite Scroll" or standard page-by-page? *The spec mentions "Paginação via API", suggesting standard table pagination.*

## Verification Plan

### Automated/Manual Tests
- **Connection Test**: Connect with a new account, verify it appears in the list with "Online" status.
- **Persistence Test**: Disconnect the player, verify status changes to "Offline" but the record remains in the table.
- **Update Test**: Reconnect with the same SteamID but a different Name; verify the name is updated in the list.
- **Scalability**: Verify that pagination works by mocking multiple player records in the DB.
