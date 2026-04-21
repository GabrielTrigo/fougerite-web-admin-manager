// ============================================================
// FWAM — Domain Models
// ============================================================

export interface Player {
  uid: string;
  name: string;
  steamId: string;
  ping: number;
  health: number;
  location: Vector3;
  timeOnline: number; // seconds
  isAdmin: boolean;
  isDev: boolean;
  isBleeding: boolean;
  isConnected: boolean;
  ip: string;
  connectedAt: Date;
  avatarUrl: string;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Ban {
  id: string;
  uid: string;
  playerName: string;
  ip: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
  expiresAt: Date | null; // null = permanent
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
  channel: 'global' | 'team' | 'local';
}

export interface KillEvent {
  id: string;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weapon: string;
  distance: number;
  timestamp: Date;
}

export interface GameEvent {
  id: string;
  type: EventType;
  playerId?: string;
  playerName?: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  timestamp: Date;
  data?: Object;
}

export interface GameEventPlayerConnectedData {
  ip: string;
  location: Vector3;
  ping: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
}

export type EventType =
  | 'PlayerConnected'
  | 'PlayerDisconnected'
  | 'PlayerKilled'
  | 'PlayerBanned'
  | 'Airdrop'
  | 'ServerSave'
  | 'PluginError'
  | 'SuspiciousActivity'
  | 'CraftHack'
  | 'FloodDetected'
  | 'Chat'
  | 'PlayerMoved'
  | 'FWAM_Response_ServerTelemetry';

export interface ServerTelemetryData {
  uptime: number;
  map: string;
  entities: number;
  lastSave: string;
  nextSave: string;
  saveCountdown: number;
  plugins: number;
  version: string;
}

export interface SummaryResponse {
  telemetry: ServerTelemetryData | null;
  onlinePlayers: number;
  eventsToday: number;
  playerCountHistory: AnalyticsPoint[];
  recentEvents: any[];
}

export interface ServerStatus {
  name: string;
  map: string;
  maxPlayers: number;
  currentPlayers: number;
  version: string;
  uptimeSeconds: number;
  saveCountdownSeconds: number;
  saveCooldownActive: boolean;
  isOnline: boolean;
  entityCount: number;
  lastSaveDuration: number; // ms
  pluginCount: number;
}

export interface AutomationJob {
  id: string;
  name: string;
  description: string;
  type: 'restart' | 'airdrop' | 'broadcast' | 'wipe' | 'custom';
  cronExpression: string;
  nextRunAt: Date;
  lastRunAt: Date | null;
  isEnabled: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface IpBlacklistEntry {
  id: string;
  ip: string;
  reason: string;
  addedBy: string;
  addedAt: Date;
}

export interface AuditEntry {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

export interface AnalyticsPoint {
  timestamp: Date;
  value: number;
}

export interface WeaponStat {
  weapon: string;
  kills: number;
  damage: number;
  headshots: number;
}

export interface ResourceStat {
  resource: string;
  amount: number;
  color?: string;
}

export interface ConsoleEntry {
  id: string;
  message: string;
  type: 'output' | 'input' | 'error' | 'warning';
  timestamp: Date;
}
