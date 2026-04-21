import { Injectable, signal, inject, effect } from '@angular/core';
import { EventService } from './event.service';
import {
  Player, Ban, ChatMessage, KillEvent, GameEvent,
  ServerStatus, AutomationJob, IpBlacklistEntry,
  AuditEntry, AnalyticsPoint, WeaponStat, ResourceStat, ConsoleEntry
} from '../models/models';

// ============================================================
// FWAM — Mock Data Service
// Centralises ALL mocked data. Replace methods with HTTP calls
// in Phase 2 (Backend integration) without touching components.
// ============================================================

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private eventService = inject(EventService);
  readonly serverWhitelist = signal<boolean>(false);

  readonly serverStatus = signal<ServerStatus>({
    name: 'Rust Legacy — Fougerite #1',
    map: 'rust_island_2013',
    maxPlayers: 100,
    currentPlayers: 0,
    version: 'Fougerite v1.9.2 · Rust Legacy v225',
    uptimeSeconds: 0,
    saveCountdownSeconds: 0,
    saveCooldownActive: false,
    isOnline: true,
    entityCount: 0,
    lastSaveDuration: 0,
    pluginCount: 0
  });

  constructor() {
    // Sincroniza o status do servidor com os eventos reais do SignalR
    effect(() => {
      const realStatus = this.eventService.serverStatus();
      if (realStatus) {
        this.serverStatus.set(realStatus);
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // PLAYERS
  // ──────────────────────────────────────────────────────────
  readonly players = signal<Player[]>([
    this.p('76561198000000001', 'DreTaX',      42,  100, 1204,  51, -872,  14400, true,  true,  false),
    this.p('76561198000000002', 'Xzekiel',     68,   87,  -340,  45,  512,   7200, true,  false, false),
    this.p('76561198000000003', 'NightRaider',112,   54,   892,  49,  -201,  3600, false, false, true),
    this.p('76561198000000004', 'SandStorm',   55,  100,  -1540, 52,  840,   9000, false, false, false),
    this.p('76561198000000005', 'IronWolf',    89,   72,   310,  48, -1200,  1800, false, false, false),
    this.p('76561198000000006', 'GhostBlade',  34,  100,  -900,  50,  670,  21600, false, false, false),
    this.p('76561198000000007', 'PyroKing',   145,   30,   220,  47, -380,    900, false, false, true),
    this.p('76561198000000008', 'DarkViper',   77,   95,   780,  51, -540,   5400, false, false, false),
    this.p('76561198000000009', 'Sniperess',   61,   88,  -1200, 53,  980,  10800, false, false, false),
    this.p('76561198000000010', 'ClanLeader',  48,  100,   450,  49, -720,  18000, false, false, false),
    this.p('76561198000000011', 'RustBeginner',203,  15,   100,  45,  100,    300, false, false, true),
    this.p('76561198000000012', 'TheBuilder',  55,  100,  -200,  50,  200,  14400, false, false, false),
    this.p('76561198000000013', 'LootGoblin',  92,   63,   600,  48, -900,   3600, false, false, false),
    this.p('76561198000000014', 'FarmKing',    44,  100,  1000,  52, -600,  25200, false, false, false),
    this.p('76561198000000015', 'CaveRat',     78,   45,  -800,  40, -1100,   7200, false, false, true),
  ]);

  // ──────────────────────────────────────────────────────────
  // BANS
  // ──────────────────────────────────────────────────────────
  readonly bans = signal<Ban[]>([
    {
      id: 'b1', uid: '76561198099990001', playerName: 'SpeedHaxor',
      ip: '185.220.101.45', reason: 'Speed hack + item duplication',
      bannedBy: 'DreTaX', bannedAt: new Date('2026-04-08T14:32:00Z'),
      expiresAt: null, isActive: true
    },
    {
      id: 'b2', uid: '76561198099990002', playerName: 'WallPwnr',
      ip: '185.220.102.11', reason: 'Wall hack confirmed by admin',
      bannedBy: 'Xzekiel', bannedAt: new Date('2026-04-07T09:15:00Z'),
      expiresAt: null, isActive: true
    },
    {
      id: 'b3', uid: '76561198099990003', playerName: 'ToxicPlayer',
      ip: '91.134.156.22', reason: 'Extreme toxicity and hate speech',
      bannedBy: 'DreTaX', bannedAt: new Date('2026-04-06T20:44:00Z'),
      expiresAt: new Date('2026-04-13T20:44:00Z'), isActive: true
    },
    {
      id: 'b4', uid: '76561198099990004', playerName: 'CraftHax2000',
      ip: '54.38.178.90', reason: 'AutoBan: craft hack detected',
      bannedBy: 'System', bannedAt: new Date('2026-04-05T16:20:00Z'),
      expiresAt: null, isActive: true
    },
    {
      id: 'b5', uid: '76561198099990005', playerName: 'FormerBanned',
      ip: '192.168.1.55', reason: 'Harassment',
      bannedBy: 'Xzekiel', bannedAt: new Date('2026-03-20T12:00:00Z'),
      expiresAt: new Date('2026-04-03T12:00:00Z'), isActive: false
    },
  ]);

  // ──────────────────────────────────────────────────────────
  // CHAT
  // ──────────────────────────────────────────────────────────
  readonly chatMessages = signal<ChatMessage[]>([
    this.chat('76561198000000001', 'DreTaX',     '[Admin] Server will restart in 30 minutes', true,  'global'),
    this.chat('76561198000000004', 'SandStorm',  'Anyone at grid E7?',                        false, 'global'),
    this.chat('76561198000000006', 'GhostBlade', 'Need help, being raided!',                  false, 'global'),
    this.chat('76561198000000010', 'ClanLeader', 'Base secured, good fight',                  false, 'global'),
    this.chat('76561198000000002', 'Xzekiel',    '[Admin] Airdrop incoming at sector 4',      true,  'global'),
    this.chat('76561198000000008', 'DarkViper',  'Trading M4 for 500 wood',                   false, 'global'),
    this.chat('76561198000000009', 'Sniperess',  'Campfire at cave north',                    false, 'global'),
    this.chat('76561198000000012', 'TheBuilder', 'Building a shop near rad town',             false, 'global'),
    this.chat('76561198000000003', 'NightRaider','Get rekt lol',                              false, 'global'),
    this.chat('76561198000000014', 'FarmKing',   '2k metal, trading for food',                false, 'global'),
  ]);

  // ──────────────────────────────────────────────────────────
  // KILL FEED
  // ──────────────────────────────────────────────────────────
  readonly killFeed = signal<KillEvent[]>([
    this.kill('NightRaider', 'RustBeginner', 'M4 Rifle',       124),
    this.kill('GhostBlade',  'CaveRat',      'Bolt Action',     87),
    this.kill('IronWolf',    'PyroKing',     'MP5A4',           34),
    this.kill('DarkViper',   'LootGoblin',   'Shotgun',         12),
    this.kill('Sniperess',   'SandStorm',    'Bolt Action',    215),
    this.kill('ClanLeader',  'TheBuilder',   'Explosive Charge', 0),
    this.kill('PyroKing',    'FarmKing',     'Flame Thrower',    5),
    this.kill('CaveRat',     'GhostBlade',   'Revolver',        18),
  ]);

  // ──────────────────────────────────────────────────────────
  // GAME EVENTS (Security/Audit feed)
  // ──────────────────────────────────────────────────────────
  readonly gameEvents = signal<GameEvent[]>([
    { id: 'e1', type: 'PlayerConnected',  playerName: 'FarmKing',    message: 'FarmKing connected (85.14.22.100)', severity: 'info',    timestamp: new Date(Date.now() - 120000) },
    { id: 'e2', type: 'SuspiciousActivity', playerName: 'RustBeginner', message: 'High speed movement detected (RustBeginner)', severity: 'warning', timestamp: new Date(Date.now() - 240000) },
    { id: 'e3', type: 'PlayerBanned',     playerName: 'SpeedHaxor',   message: 'Player banned: SpeedHaxor (speed hack)', severity: 'danger',  timestamp: new Date(Date.now() - 600000) },
    { id: 'e4', type: 'Airdrop',                                       message: 'Airdrop spawned at (1204, 0, -872)', severity: 'info',    timestamp: new Date(Date.now() - 900000) },
    { id: 'e5', type: 'ServerSave',                                    message: 'World saved in 1840ms (14382 entities)', severity: 'success', timestamp: new Date(Date.now() - 1200000) },
    { id: 'e6', type: 'CraftHack',        playerName: 'CraftHax2000', message: 'Craft hack detected — AutoBan triggered', severity: 'danger',  timestamp: new Date(Date.now() - 1800000) },
    { id: 'e7', type: 'FloodDetected',    playerName: '185.220.101.45', message: 'Connection flood from 185.220.101.45 (6/s)', severity: 'warning', timestamp: new Date(Date.now() - 2400000) },
    { id: 'e8', type: 'PluginError',                                   message: 'Plugin "HomePlugin" threw NullReferenceException', severity: 'warning', timestamp: new Date(Date.now() - 3600000) },
  ]);

  // ──────────────────────────────────────────────────────────
  // AUTOMATION JOBS
  // ──────────────────────────────────────────────────────────
  readonly automationJobs = signal<AutomationJob[]>([
    {
      id: 'j1', name: 'Daily Restart', type: 'restart',
      description: 'Server restart with 10/5/1min warnings',
      cronExpression: '0 6 * * *',
      nextRunAt: new Date(Date.now() + 28800000),
      lastRunAt: new Date(Date.now() - 57600000),
      isEnabled: true, status: 'pending'
    },
    {
      id: 'j2', name: 'Hourly Airdrop', type: 'airdrop',
      description: 'Random airdrop every hour',
      cronExpression: '0 * * * *',
      nextRunAt: new Date(Date.now() + 1800000),
      lastRunAt: new Date(Date.now() - 1800000),
      isEnabled: true, status: 'pending'
    },
    {
      id: 'j3', name: 'Server Announcements', type: 'broadcast',
      description: 'Rotating server info messages (every 15 min)',
      cronExpression: '*/15 * * * *',
      nextRunAt: new Date(Date.now() + 420000),
      lastRunAt: new Date(Date.now() - 480000),
      isEnabled: true, status: 'pending'
    },
    {
      id: 'j4', name: 'Weekly Wipe', type: 'wipe',
      description: 'Full server wipe every Thursday',
      cronExpression: '0 8 * * 4',
      nextRunAt: new Date(Date.now() + 259200000),
      lastRunAt: new Date(Date.now() - 345600000),
      isEnabled: false, status: 'pending'
    },
  ]);

  // ──────────────────────────────────────────────────────────
  // ANALYTICS
  // ──────────────────────────────────────────────────────────
  getPlayerCountHistory(hours = 24): AnalyticsPoint[] {
    const now = Date.now();
    return Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i - 1) * 3600000),
      value: Math.max(0, Math.floor(20 + Math.sin(i / 3) * 18 + Math.random() * 12))
    }));
  }

  getKillsPerHour(hours = 24): AnalyticsPoint[] {
    const now = Date.now();
    return Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i - 1) * 3600000),
      value: Math.floor(Math.max(0, 15 + Math.sin(i / 2) * 12 + Math.random() * 8))
    }));
  }

  getWeaponStats(): WeaponStat[] {
    return [
      { weapon: 'Bolt Action Rifle', kills: 142, damage: 28400, headshots: 67 },
      { weapon: 'M4 Rifle',          kills: 118, damage: 21240, headshots: 34 },
      { weapon: 'Shotgun',           kills:  87, damage: 15660, headshots: 12 },
      { weapon: 'MP5A4',             kills:  74, damage: 14060, headshots: 18 },
      { weapon: 'Revolver',          kills:  63, damage:  9450, headshots: 22 },
      { weapon: 'Crossbow',          kills:  45, damage:  8100, headshots: 28 },
      { weapon: 'Explosive Charge',  kills:  38, damage: 19000, headshots:  0 },
      { weapon: 'F1 Grenade',        kills:  29, damage: 11600, headshots:  0 },
    ];
  }

  getResourceStats(): ResourceStat[] {
    return [
      { resource: 'Wood',       amount: 2840420, color: '#8B5E3C' },
      { resource: 'Metal Ore', amount: 1240800, color: '#9E9E9E' },
      { resource: 'Stones',    amount:  980340, color: '#757575' },
      { resource: 'Sulfur',    amount:  420100, color: '#D4C526' },
      { resource: 'Animal Fat',amount:  210550, color: '#E0AC6A' },
      { resource: 'Cloth',     amount:  180200, color: '#A5B553' },
    ];
  }

  // ──────────────────────────────────────────────────────────
  // IP BLACKLIST
  // ──────────────────────────────────────────────────────────
  readonly ipBlacklist = signal<IpBlacklistEntry[]>([
    { id: 'ip1', ip: '185.220.101.45', reason: 'Known proxy — ban evasion',  addedBy: 'DreTaX',  addedAt: new Date('2026-04-08T14:32:00Z') },
    { id: 'ip2', ip: '185.220.102.11', reason: 'VPN range — repeated bans',  addedBy: 'Xzekiel', addedAt: new Date('2026-04-07T09:15:00Z') },
    { id: 'ip3', ip: '91.134.156.22',  reason: 'Toxic player IP',            addedBy: 'DreTaX',  addedAt: new Date('2026-04-06T20:44:00Z') },
    { id: 'ip4', ip: '54.38.178.90',   reason: 'Bot/scanner detected',       addedBy: 'System',  addedAt: new Date('2026-04-05T16:20:00Z') },
  ]);

  // ──────────────────────────────────────────────────────────
  // AUDIT TRAIL
  // ──────────────────────────────────────────────────────────
  readonly auditLog = signal<AuditEntry[]>([
    { id: 'a1', adminName: 'DreTaX',  action: 'BAN',      target: 'SpeedHaxor',  details: 'Speed hack confirmed',         timestamp: new Date(Date.now() - 600000),  ipAddress: '10.0.0.2' },
    { id: 'a2', adminName: 'Xzekiel', action: 'KICK',     target: 'PyroKing',    details: 'High ping: 145ms',             timestamp: new Date(Date.now() - 1800000), ipAddress: '10.0.0.3' },
    { id: 'a3', adminName: 'DreTaX',  action: 'AIRDROP',  target: 'World',       details: 'Manual airdrop at (0,0,0)',     timestamp: new Date(Date.now() - 3600000), ipAddress: '10.0.0.2' },
    { id: 'a4', adminName: 'DreTaX',  action: 'GIVE',     target: 'GhostBlade',  details: 'Wood x1000',                   timestamp: new Date(Date.now() - 7200000), ipAddress: '10.0.0.2' },
    { id: 'a5', adminName: 'Xzekiel', action: 'TELEPORT', target: 'RustBeginner',details: 'Teleported to (0, 50, 0)',     timestamp: new Date(Date.now() - 10800000),ipAddress: '10.0.0.3' },
    { id: 'a6', adminName: 'DreTaX',  action: 'UNBAN',    target: 'FormerBanned',details: 'Appealed and pardoned',        timestamp: new Date(Date.now() - 86400000),ipAddress: '10.0.0.2' },
  ]);

  // ──────────────────────────────────────────────────────────
  // CONSOLE HISTORY
  // ──────────────────────────────────────────────────────────
  readonly consoleHistory = signal<ConsoleEntry[]>([
    { id: 'c1', message: '>>> Fougerite v1.9.2 initialized', type: 'output', timestamp: new Date(Date.now() - 259200000) },
    { id: 'c2', message: '>>> Loading 12 plugins...', type: 'output', timestamp: new Date(Date.now() - 259100000) },
    { id: 'c3', message: '>>> All plugins loaded successfully.', type: 'output', timestamp: new Date(Date.now() - 259000000) },
    { id: 'c4', message: 'fougerite.reload HomePlugin', type: 'input', timestamp: new Date(Date.now() - 3600000) },
    { id: 'c5', message: '>>> HomePlugin reloaded successfully.', type: 'output', timestamp: new Date(Date.now() - 3599000) },
    { id: 'c6', message: '[ERROR] NullReferenceException in HomePlugin.On_Command', type: 'error', timestamp: new Date(Date.now() - 3598000) },
    { id: 'c7', message: 'server.save', type: 'input', timestamp: new Date(Date.now() - 1800000) },
    { id: 'c8', message: '>>> World saved: 14382 entities in 1840ms', type: 'output', timestamp: new Date(Date.now() - 1799000) },
  ]);

  // ──────────────────────────────────────────────────────────
  // HELPERS (private factory methods)
  // ──────────────────────────────────────────────────────────
  private p(
    uid: string, name: string, ping: number, health: number,
    x: number, y: number, z: number, timeOnline: number,
    isAdmin: boolean, isDev: boolean, isBleeding: boolean
  ): Player {
    const steamId = (BigInt('76561197960265728') + BigInt(uid.slice(-6))).toString();
    return {
      uid, name, steamId, ping, health,
      location: { x, y, z }, timeOnline,
      isAdmin, isDev, isBleeding, isConnected: true,
      ip: `${Math.floor(Math.random()*200)+10}.${Math.floor(Math.random()*254)}.${Math.floor(Math.random()*254)}.${Math.floor(Math.random()*254)}`,
      connectedAt: new Date(Date.now() - timeOnline * 1000),
      avatarUrl: `https://api.dicebear.com/9.x/bottts/svg?seed=${uid}`
    };
  }

  private chat(uid: string, name: string, message: string, isAdmin: boolean, channel: 'global'|'team'|'local'): ChatMessage {
    return {
      id: `msg-${uid}-${Date.now()}-${Math.random()}`,
      playerId: uid, playerName: name, message, isAdmin, channel,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 600000))
    };
  }

  private kill(killerName: string, victimName: string, weapon: string, distance: number): KillEvent {
    return {
      id: `k-${killerName}-${Date.now()}-${Math.random()}`,
      killerId:   '0', killerName,
      victimId:   '0', victimName,
      weapon, distance,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 300000))
    };
  }

  // ──────────────────────────────────────────────────────────
  // SIMULATION ACTIONS (Invoked by UI)
  // ──────────────────────────────────────────────────────────

  sendChatMessage(message: string, channel: 'global' | 'team' | 'local' = 'global') {
    const newMessage = this.chat('SERVER_ADMIN', 'SERVER CONSOLE', message, true, channel);
    // Adiciona a nova mensagem garantindo a imutabilidade do signal
    this.chatMessages.update(msgs => [...msgs, newMessage]);
  }

  sendConsoleCommand(command: string) {
    if (!command.trim()) return;

    // Adiciona o input do usuário na tela
    const inputEntry: ConsoleEntry = {
      id: `c-${Date.now()}-in`,
      type: 'input',
      message: command,
      timestamp: new Date()
    };
    this.consoleHistory.update(history => [...history, inputEntry]);

    // Simula o delay da RCON (300-800ms) processando o comando
    setTimeout(() => {
      let outputEntry: ConsoleEntry = {
        id: `c-${Date.now()}-out`,
        type: 'output',
        message: '',
        timestamp: new Date()
      };

      const cmdLower = command.toLowerCase();
      if (cmdLower === 'server.save') {
        outputEntry.message = '>>> World saved: 14502 entities in 1910ms';
      } else if (cmdLower.startsWith('status') || cmdLower === 'server.status') {
        outputEntry.message = `hostname: Fougerite #1\nversion : 1069\nmap     : rust_island_2013\nplayers : ${this.serverStatus().currentPlayers} (100 max)`;
      } else if (cmdLower === 'clear') {
        this.consoleHistory.set([]);
        return; // Early return as we clear the screen
      } else if (cmdLower.startsWith('kick')) {
        outputEntry.message = '>>> Player kicked successfully.';
      } else {
        outputEntry.message = `Command not found: ${command}`;
        outputEntry.type = 'error';
      }

      this.consoleHistory.update(history => [...history, outputEntry]);
    }, 400 + Math.random() * 400); 
  }

  // ──────────────────────────────────────────────────────────
  // BANS SIMULATION
  // ──────────────────────────────────────────────────────────

  unbanPlayer(banId: string) {
    this.bans.update(list => list.map(b => {
      if (b.id === banId) {
        return { ...b, isActive: false, expiresAt: new Date() };
      }
      return b;
    }));
  }

  addManualBan(data: Partial<Ban>) {
    const newBan: Ban = {
      id: `b-${Date.now()}`,
      uid: data.uid || 'N/A',
      playerName: data.playerName || 'Unknown',
      ip: data.ip || '0.0.0.0',
      reason: data.reason || 'Manual Ban',
      bannedBy: 'Console/FWAM Admin',
      bannedAt: new Date(),
      expiresAt: null,
      isActive: true
    };
    this.bans.update(list => [newBan, ...list]);
  }

  // ──────────────────────────────────────────────────────────
  // AUTOMATION SIMULATION
  // ──────────────────────────────────────────────────────────

  toggleAutomationJob(jobId: string, isEnabled: boolean) {
    this.automationJobs.update(jobs => 
      jobs.map(job => job.id === jobId ? { ...job, isEnabled } : job)
    );
  }

  // ──────────────────────────────────────────────────────────
  // SECURITY SIMULATION
  // ──────────────────────────────────────────────────────────

  toggleWhitelistMode(status: boolean) {
    this.serverWhitelist.set(status);
  }

  addIpBlacklist(ip: string, reason: string) {
    this.ipBlacklist.update(list => [
      {
        id: Math.random().toString(36).substr(2, 9),
        ip,
        reason,
        addedBy: 'Admin (Mock)',
        addedAt: new Date()
      },
      ...list
    ]);
  }

  removeIpBlacklist(id: string) {
    this.ipBlacklist.update(list => list.filter(entry => entry.id !== id));
  }
}

