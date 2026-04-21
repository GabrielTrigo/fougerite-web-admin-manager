import { Injectable, signal, computed, inject } from '@angular/core';
import { GameEvent, GameEventPlayerConnectedData, Player, ServerStatus, ServerTelemetryData } from '../models/models';
import { AdminApiService } from './admin-api.service';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private adminApi = inject(AdminApiService);
  private signalr = inject(SignalRService);
  private processedEventIds = new Set<string>();
  
  // Signals para estado reativo no Angular
  public events = signal<GameEvent[]>([]);
  public onlinePlayers = signal<Player[]>([]);
  public allPlayers = signal<Player[]>([]); // Lista global (Online + Offline)
  public connectionStatus = this.signalr.connectionStatus;

  // Signal para telemetria em tempo real
  public serverStatus = signal<ServerStatus | null>(null);
  public eventsToday = signal<number>(0);
  public playerCountHistory = signal<{timestamp: Date, value: number}[]>([]);

  // Sinais computados para feeds específicos
  public chatMessages = computed(() => 
    this.events()
      .filter(e => e.type === 'Chat')
      .map(e => ({
        id: e.id,
        playerId: e.playerId || '',
        playerName: e.playerName || 'Unknown',
        message: e.message,
        timestamp: e.timestamp,
        isAdmin: e.message.includes('[ADMIN]'),
        channel: 'global' as 'global'
      }))
  );

  public consoleHistory = computed(() =>
    this.events()
      .filter(e => ['Chat', 'PlayerConnected', 'PlayerDisconnected', 'PlayerKilled'].includes(e.type))
      .map(e => ({
        id: e.id,
        message: `[${e.type}] ${e.message}`,
        type: this.getConsoleType(e.type),
        timestamp: e.timestamp
      }))
  );

  constructor() {
    this.loadSummary();
    this.subscribeToRealTimeEvents();
  }

  private loadSummary() {
    console.log('[FWAM EventService] Carregando resumo inicial via HTTP...');
    this.adminApi.getSummary().subscribe({
      next: (summary) => {
        console.log('[FWAM EventService] Resumo recebido:', summary);
        
        // 1. Inicializa Telemetria/Status do Servidor
        if (summary.telemetry) {
          this.serverStatus.set({
            name: 'Fougerite Web Admin Manager',
            map: summary.telemetry.map,
            maxPlayers: 100, // TODO: Pegar do server se disponível
            currentPlayers: summary.onlinePlayers,
            version: `Fougerite v${summary.telemetry.version}`,
            uptimeSeconds: summary.telemetry.uptime,
            saveCountdownSeconds: summary.telemetry.saveCountdown,
            saveCooldownActive: false,
            isOnline: true,
            entityCount: summary.telemetry.entities,
            lastSaveDuration: 0,
            pluginCount: summary.telemetry.plugins
          });
        }

        // 2. Carrega eventos recentes para o feed
        if (summary.recentEvents) {
          const events = summary.recentEvents.map(raw => this.mapToGameEvent(raw));
          events.forEach(e => this.processedEventIds.add(e.id));
          this.events.set(events);
        }

        // 3. Estatísticas extras
        this.eventsToday.set(summary.eventsToday);
        this.playerCountHistory.set(summary.playerCountHistory.map(p => ({
          timestamp: new Date(p.timestamp),
          value: p.value
        })));

        // 3. Nota: O onlinePlayers count agora vem do summary, mas a lista de objetos Player
        // precisaria de uma chamada adicional /players ou ser incluída no summary se necessário para o mapa.
      },
      error: (err) => console.error('[FWAM EventService] Erro ao carregar resumo:', err)
    });
  }

  private subscribeToRealTimeEvents() {
    console.log('[FWAM EventService] Escutando eventos SignalR...');
    this.signalr.eventReceived$.subscribe(raw => {
      if (this.processedEventIds.has(raw.Id)) return;
      
      this.processedEventIds.add(raw.Id);
      const newEvent = this.mapToGameEvent(raw);
      this.handleNewEvent(newEvent);
    });
  }

  private mapToGameEvent(raw: any): GameEvent {
    return {
      id: raw.Id,
      type: raw.Type,
      playerId: raw.UID,
      playerName: raw.Name,
      timestamp: new Date(raw.Time),
      message: this.parsePayloadToMessage(raw),
      severity: this.determineSeverity(raw.Type),
      data: raw.Data
    };
  }

  private handleNewEvent(newEvent: GameEvent) {
    console.log('[FWAM EventService] handleNewEvent:', newEvent);

    // Gerencia lista de jogadores online e global
    if (newEvent.type === 'FWAM_Response_ServerTelemetry') {
      const tel = newEvent.data as ServerTelemetryData;
      if (tel) {
        this.serverStatus.update(current => ({
          name: 'Fougerite Web Admin Manager',
          map: tel.map,
          maxPlayers: current?.maxPlayers || 100,
          currentPlayers: this.onlinePlayers().length,
          version: `Fougerite v${tel.version}`,
          uptimeSeconds: tel.uptime,
          saveCountdownSeconds: tel.saveCountdown,
          saveCooldownActive: false,
          isOnline: true,
          entityCount: tel.entities,
          lastSaveDuration: current?.lastSaveDuration || 0,
          pluginCount: tel.plugins
        }));
      }
      return; // Telemetria não precisa de mais processamento aqui
    }

    if (!newEvent.playerId) {
      console.warn('[FWAM EventService] Evento ignorado por falta de playerId:', newEvent);
      return;
    }

    // Atualiza o Signal de eventos (mantém apenas os últimos 50 para performance)
    this.events.update(prev => [newEvent, ...prev].slice(0, 50));

    const playerId = newEvent.playerId;

    // Gerencia lista de jogadores online e global
    if (newEvent.type === 'PlayerConnected') {
      const playerConnectedData = newEvent.data as GameEventPlayerConnectedData;
      
      const newPlayer: Player = {
        uid: playerId,
        name: newEvent.playerName || 'Unknown',
        steamId: playerId,
        ping: playerConnectedData?.ping ?? 0,
        health: 100,
        location: playerConnectedData?.location ?? { x: 0, y: 0, z: 0 },
        timeOnline: 0,
        isAdmin: false,
        isDev: false,
        isBleeding: false,
        isConnected: true,
        ip: playerConnectedData?.ip || '0.0.0.0',
        connectedAt: newEvent.timestamp,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newEvent.playerName || playerId}`
      };

      // 1. Atualiza lista de Online (Legado/Compatibilidade)
      this.onlinePlayers.update(prev => {
        if (prev.find(p => p.uid === playerId)) return prev;
        return [...prev, newPlayer];
      });

      // 2. Sincroniza status na lista Global (Feature-001)
      this.allPlayers.update(prev => {
        const exists = prev.some(p => p.uid === playerId);
        if (exists) {
          return prev.map(p => {
            if (p.uid === playerId) {
              return { 
                ...p, 
                isConnected: true, 
                name: newPlayer.name,
                ping: newPlayer.ping,
                location: newPlayer.location,
                ip: newPlayer.ip
              };
            }
            return p;
          });
        }
        // Se não existir na lista atual (ex: nova página ou primeiro login), adiciona no topo
        return [newPlayer, ...prev];
      });

    } else if (newEvent.type === 'PlayerDisconnected') {
      this.onlinePlayers.update(prev => prev.filter(p => p.uid !== playerId));
      
      this.allPlayers.update(prev => prev.map(p => {
        if (p.uid === playerId) {
          return { ...p, isConnected: false };
        }
        return p;
      }));

    } else if (newEvent.type === 'PlayerMoved') {
      const playerMovedData = newEvent.data as { x: number; y: number; z: number };
      if (!playerMovedData) return;

      const updatedLocation = { x: playerMovedData.x, y: playerMovedData.y, z: playerMovedData.z };
      
      this.onlinePlayers.update(prev => prev.map(p => {
        if (p.uid === playerId) {
          return { ...p, location: updatedLocation };
        }
        return p;
      }));

      this.allPlayers.update(prev => prev.map(p => {
        if (p.uid === playerId) {
          return { ...p, location: updatedLocation };
        }
        return p;
      }));
    }

    // Limpeza de IDs processados para evitar vazamento de memória (mantém os últimos 500)
    if (this.processedEventIds.size > 500) {
      const it = this.processedEventIds.values();
      for (let i = 0; i < 100; i++) {
        const val = it.next().value;
        if (val !== undefined) {
          this.processedEventIds.delete(val);
        }
      }
    }
  }

  private parsePayloadToMessage(raw: any): string {
    try {
      if (raw.Type === 'Chat') return raw.Data.message;
      if (raw.Type === 'PlayerMoved') return `Moved to ${raw.Data.x}, ${raw.Data.y}, ${raw.Data.z}`;
      if (raw.Type === 'PlayerConnected') return 'Joined the server';
      if (raw.Type === 'PlayerDisconnected') return 'Left the server';
      return JSON.stringify(raw.Data);
    } catch {
      return 'Unknown event data';
    }
  }

  private determineSeverity(type: string): 'info' | 'warning' | 'danger' | 'success' {
    if (type.includes('Killed') || type.includes('Hurt')) return 'danger';
    if (type.includes('Banned') || type.includes('Flood')) return 'warning';
    if (type.includes('Connected')) return 'success';
    return 'info';
  }

  private getConsoleType(type: string): 'output' | 'input' | 'error' | 'warning' {
    if (type.includes('Killed')) return 'warning';
    return 'output';
  }
}
