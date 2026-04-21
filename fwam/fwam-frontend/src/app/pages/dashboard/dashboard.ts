import { Component, inject, signal, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventService } from '../../core/services/event.service';
import { KillEvent, ChatMessage, GameEvent, Player } from '../../core/models/models';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexChart, ApexAxisChartSeries, ApexXAxis, ApexStroke,
  ApexFill, ApexTooltip, ApexGrid, ApexDataLabels
} from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  imports: [NgApexchartsModule],
  template: `
    <div class="animate-rust-fade-in space-y-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl m-0" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
            Dashboard
          </h1>
          <p class="text-xs mt-1 m-0" style="color: var(--color-rust-text-muted); font-family: var(--font-rust-mono)">
            {{ now() }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="live-dot text-xs" style="color: var(--color-rust-success-light); font-family: var(--font-rust-display); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em">Live</span>
        </div>
      </div>

      <!-- ── STAT CARDS ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Players Online -->
        <div class="rust-panel-accent p-4 rust-glow-hover transition-all duration-200">
          <div class="flex items-start justify-between">
            <div>
              <div class="section-label mb-2">Players Online</div>
              <div class="text-3xl font-bold" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
                {{ serverStatus()?.currentPlayers || 0 }}
                <span class="text-base font-normal" style="color: var(--color-rust-text-muted)">/{{ serverStatus()?.maxPlayers || 100 }}</span>
              </div>
              <div class="text-xs mt-1.5" style="color: var(--color-rust-success-light)">
                ▲ +3 in the last hour
              </div>
            </div>
            <div class="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                 style="background: var(--color-rust-glow)">
              <i class="pi pi-users" style="color: var(--color-rust-500); font-size: 1.1rem"></i>
            </div>
          </div>
          <!-- mini bar -->
          <div class="mt-3 h-1 rounded-full overflow-hidden" style="background: var(--color-rust-border)">
            <div class="h-full rounded-full" style="background: var(--color-rust-500)" 
                 [style.width.%]="((serverStatus()?.currentPlayers || 0) / (serverStatus()?.maxPlayers || 100) * 100)"></div>
          </div>
        </div>

        <!-- Active Bans -->
        <div class="rust-panel p-4 rust-glow-hover transition-all duration-200"
             style="border-top: 2px solid var(--color-rust-danger)">
          <div class="flex items-start justify-between">
            <div>
              <div class="section-label mb-2">Active Bans</div>
              <div class="text-3xl font-bold" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
                {{ activeBansCount() }}
              </div>
              <div class="text-xs mt-1.5" style="color: var(--color-rust-warning-light)">
                1 expires in 4 days
              </div>
            </div>
            <div class="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                 style="background: var(--color-rust-danger-glow)">
              <i class="pi pi-ban" style="color: var(--color-rust-danger-light); font-size: 1.1rem"></i>
            </div>
          </div>
        </div>

        <!-- Events Today -->
        <div class="rust-panel p-4 rust-glow-hover transition-all duration-200"
             style="border-top: 2px solid var(--color-rust-info)">
          <div class="flex items-start justify-between">
            <div>
              <div class="section-label mb-2">Events Today</div>
              <div class="text-3xl font-bold" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
                {{ eventsToday() }}
              </div>
              <div class="text-xs mt-1.5" style="color: var(--color-rust-danger-light)">
                2 require attention
              </div>
            </div>
            <div class="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                 style="background: #2a4a6b30">
              <i class="pi pi-bell" style="color: #5090c0; font-size: 1.1rem"></i>
            </div>
          </div>
        </div>

        <!-- Server Uptime -->
        <div class="rust-panel p-4 rust-glow-hover transition-all duration-200"
             style="border-top: 2px solid var(--color-rust-olive-500)">
          <div class="flex items-start justify-between">
            <div>
              <div class="section-label mb-2">Server Uptime</div>
              <div class="text-3xl font-bold" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
                {{ formatUptime(serverStatus()?.uptimeSeconds || 0) }}
              </div>
              <div class="text-xs mt-1.5 font-mono" style="color: var(--color-rust-text-muted)">
                {{ (serverStatus()?.entityCount || 0).toLocaleString() }} entities
              </div>
            </div>
            <div class="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                 style="background: var(--color-olive-500)20">
              <i class="pi pi-server" style="color: var(--color-olive-400); font-size: 1.1rem"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- ── MAIN GRID ── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <!-- Player Count Chart (2/3) -->
        <div class="xl:col-span-2 rust-panel">
          <div class="px-5 py-4 border-b border-[var(--color-rust-border)] flex items-center justify-between">
            <h3 class="m-0 text-sm" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary); text-transform: uppercase; letter-spacing: 0.08em">
              Player Count — Last 24h
            </h3>
            <span class="section-label">Peak: 48</span>
          </div>
          <div class="p-2">
            <apx-chart
              [series]="chartSeries"
              [chart]="chartOptions"
              [xaxis]="chartXAxis"
              [stroke]="chartStroke"
              [fill]="chartFill"
              [tooltip]="chartTooltip"
              [grid]="chartGrid"
              [dataLabels]="chartDataLabels"
              height="220">
            </apx-chart>
          </div>
        </div>

        <!-- Server Status (1/3) -->
        <div class="rust-panel">
          <div class="px-5 py-4 border-b border-[var(--color-rust-border)]">
            <h3 class="m-0 text-sm" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary); text-transform: uppercase; letter-spacing: 0.08em">
              Server Status
            </h3>
          </div>
          <div class="p-4 space-y-3">
            @for (row of serverInfo(); track row.label) {
              <div class="flex items-center justify-between py-1 border-b border-dashed border-[var(--color-rust-border)]">
                <span class="text-xs" style="color: var(--color-rust-text-muted); font-family: var(--font-rust-display); text-transform: uppercase; letter-spacing: 0.05em">{{ row.label }}</span>
                <span class="text-xs font-mono" style="color: var(--color-rust-text-primary)">{{ row.value }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── BOTTOM GRID ── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Kill Feed -->
        <div class="rust-panel">
          <div class="px-5 py-3 border-b border-[var(--color-rust-border)] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full animate-rust-pulse" style="background: var(--color-rust-danger-light)"></span>
            <h3 class="m-0 text-sm" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary); text-transform: uppercase; letter-spacing: 0.08em">Kill Feed</h3>
          </div>
          <div class="divide-y divide-[var(--color-rust-border)]">
            @for (kill of killFeed(); track kill.id) {
              <div class="px-4 py-2.5 flex items-center gap-2 animate-rust-fade-in hover:bg-[var(--color-rust-overlay)] transition-colors">
                <span class="text-xs font-semibold" style="color: var(--color-rust-500); font-family: var(--font-rust-display); min-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ kill.killerName }}</span>
                <span class="text-[10px] flex-1 text-center" style="color: var(--color-rust-text-muted)">
                  <i class="pi pi-times text-[8px]" style="color: var(--color-rust-danger)"></i>
                  {{ kill.weapon }}
                </span>
                <span class="text-xs" style="color: var(--color-rust-text-secondary); font-family: var(--font-rust-display); min-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right">{{ kill.victimName }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Chat Preview -->
        <div class="rust-panel">
          <div class="px-5 py-3 border-b border-[var(--color-rust-border)] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full animate-rust-pulse" style="background: var(--color-rust-success-light)"></span>
            <h3 class="m-0 text-sm" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary); text-transform: uppercase; letter-spacing: 0.08em">Chat</h3>
          </div>
          <div class="divide-y divide-[var(--color-rust-border)]">
            @for (msg of recentChat(); track msg.id) {
              <div class="px-4 py-2.5 hover:bg-[var(--color-rust-overlay)] transition-colors">
                <div class="flex items-baseline gap-2">
                  <span class="text-xs font-semibold"
                        [style.color]="msg.isAdmin ? 'var(--color-rust-500)' : 'var(--color-rust-text-secondary)'"
                        style="font-family: var(--font-rust-display); flex-shrink: 0">
                    {{ msg.isAdmin ? '[ADMIN]' : '' }} {{ msg.playerName }}
                  </span>
                </div>
                <p class="text-xs m-0 mt-0.5 leading-tight" style="color: var(--color-rust-text-primary)">{{ msg.message }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Event Log -->
        <div class="rust-panel">
          <div class="px-5 py-3 border-b border-[var(--color-rust-border)] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full animate-rust-pulse" style="background: var(--color-rust-warning-light)"></span>
            <h3 class="m-0 text-sm" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary); text-transform: uppercase; letter-spacing: 0.08em">Event Log</h3>
          </div>
          <div class="divide-y divide-[var(--color-rust-border)]">
            @for (evt of gameEvents(); track evt.id) {
              <div class="px-4 py-2.5 hover:bg-[var(--color-rust-overlay)] transition-colors">
                <div class="flex items-start gap-2">
                  <span class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        [style.background]="severityColor(evt.severity)"></span>
                  <div class="min-w-0">
                    <p class="text-xs m-0 leading-tight" style="color: var(--color-rust-text-primary)">{{ evt.message }}</p>
                    <p class="text-[10px] m-0 mt-0.5 font-mono" style="color: var(--color-rust-text-muted)">{{ timeAgo(evt.timestamp) }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit, OnDestroy {
  private data = inject(MockDataService);
  private eventService = inject(EventService);

  // Mapeamos os sinais do SignalR para as variáveis que o template já usa
  // Sinais do EventService
  readonly rawEvents = this.eventService.events;
  readonly serverStatus = this.eventService.serverStatus;
  readonly eventsToday = this.eventService.eventsToday;
  readonly playerCountHistory = this.eventService.playerCountHistory;
  
  // Computamos o KillFeed a partir dos eventos reais de morte
  readonly killFeed = signal<KillEvent[]>([]); 
  
  readonly gameEvents = this.rawEvents; 
  
  readonly currentTimestamp = signal(Date.now());
  readonly now = signal(new Date().toLocaleString('en-GB'));
  readonly activeBansCount = signal(this.data.bans().filter(b => b.isActive).length);

  readonly recentChat = signal<ChatMessage[]>([]);

  constructor() {
    // Escuta mudanças nos eventos brutos do SignalR e atualiza feeds específicos
    effect(() => {
      const events = this.rawEvents();
      
      // Atualiza Chat
      const chats = events
        .filter(e => e.type === 'Chat')
        .map(e => ({
          id: e.id,
          playerId: e.playerId || '',
          playerName: e.playerName || 'Unknown',
          message: e.message,
          timestamp: e.timestamp,
          isAdmin: e.message.includes('[ADMIN]'),
          channel: 'global' as const
        }));
      this.recentChat.set(chats.slice(0, 6));

      // Atualiza Kills
      const kills = events
        .filter(e => e.type === 'PlayerKilled')
        .map(e => ({
          id: e.id,
          killerId: '',
          killerName: e.playerName || 'Environment',
          victimId: e.playerId || '',
          victimName: 'Player', // Info vinda do Payload futuramente
          weapon: 'Unknown',
          distance: 0,
          timestamp: e.timestamp
        }));
      this.killFeed.set(kills.slice(0, 10));
    });

    // Efeito para atualizar o gráfico quando o histórico mudar
    effect(() => {
      const history = this.playerCountHistory();
      if (history.length > 0) {
        this.chartSeries = [{
          name: 'Players',
          data: history.map(p => p.value)
        }];
        
        this.chartXAxis = {
          ...this.chartXAxis,
          categories: history.map(p =>
            p.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          )
        };
      }
    });
  }

  readonly serverInfo = computed(() => {
    const s = this.serverStatus();
    return [
      { label: 'Map',       value: s?.map || 'N/A' },
      { label: 'Version',   value: s?.version || 'N/A' },
      { label: 'Entities',  value: (s?.entityCount || 0).toLocaleString() },
      { label: 'Last Save', value: `${s?.lastSaveDuration || 0}ms` },
      { label: 'Plugins',   value: `${s?.pluginCount || 0} loaded` },
      { label: 'Max Ping',  value: '220 ms' },
    ];
  });

  // ── ApexCharts config ──
  private history = this.data.getPlayerCountHistory(24);

  chartSeries: ApexAxisChartSeries = [{
    name: 'Players',
    data: this.history.map(p => p.value)
  }];

  chartOptions: ApexChart = {
    type: 'area',
    background: 'transparent',
    toolbar: { show: false },
    animations: { enabled: true, speed: 800 },
    foreColor: '#8c7d6a',
    fontFamily: 'Share Tech Mono, monospace',
  };

  chartXAxis: ApexXAxis = {
    categories: this.history.map(p =>
      p.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    ),
    tickAmount: 6,
    labels: { style: { colors: '#5c5244', fontSize: '10px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };

  chartStroke: ApexStroke = { curve: 'smooth', width: 2, colors: ['#ce6030'] };

  chartFill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 100],
      colorStops: [
        { offset: 0,   color: '#ce6030', opacity: 0.35 },
        { offset: 100, color: '#ce6030', opacity: 0.02 },
      ]
    }
  };

  chartTooltip: ApexTooltip = {
    theme: 'dark',
    style: { fontFamily: 'Share Tech Mono, monospace', fontSize: '11px' },
    x: { show: true }
  };

  chartGrid: ApexGrid = {
    borderColor: '#4a403530',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  };

  chartDataLabels: ApexDataLabels = { enabled: false };

  private interval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.interval = setInterval(() => {
      this.currentTimestamp.set(Date.now());
      this.now.set(new Date().toLocaleString('en-GB'));
    }, 1000);
  }

  ngOnDestroy() { clearInterval(this.interval); }

  formatUptime(s: number): string {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  timeAgo(date: Date): string {
    const diff = Math.floor((this.currentTimestamp() - date.getTime()) / 1000);
    if (diff < 0) return 'Just now';
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  severityColor(s: string): string {
    const map: Record<string, string> = {
      info: '#5090c0', warning: 'var(--color-rust-warning-light)',
      danger: 'var(--color-rust-danger-light)', success: 'var(--color-rust-success-light)'
    };
    return map[s] ?? '#5090c0';
  }
}
