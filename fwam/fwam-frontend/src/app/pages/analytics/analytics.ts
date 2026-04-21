import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="animate-rust-fade-in flex flex-col h-[calc(100vh-6rem)] overflow-y-auto pb-8">
      
      <!-- Top Header & Global Period Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 class="text-xl font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)]">
            Server Analytics
          </h2>
          <p class="text-sm text-[var(--color-rust-text-muted)] mt-1">
            Real-time insights on player traffic, economy, PvP, and engine performance.
          </p>
        </div>
        
        <div class="flex items-center gap-2 bg-[var(--color-rust-elevated)] rounded-sm border border-[var(--color-rust-border)] p-1">
          <button class="px-4 py-1.5 text-xs font-mono font-semibold rounded-sm transition-colors"
                  [class]="period() === '24h' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                  (click)="setPeriod('24h')">24h</button>
          <button class="px-4 py-1.5 text-xs font-mono font-semibold rounded-sm transition-colors"
                  [class]="period() === '7d' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                  (click)="setPeriod('7d')">7d</button>
          <button class="px-4 py-1.5 text-xs font-mono font-semibold rounded-sm transition-colors"
                  [class]="period() === '30d' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                  (click)="setPeriod('30d')">30d</button>
        </div>
      </div>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <!-- ROW 1: Player History (Wide) -->
        <div class="rust-panel p-5 xl:col-span-2">
          <h3 class="section-label mb-4">Traffic History (Players Online)</h3>
          <apx-chart
            [series]="playerChart.series"
            [chart]="playerChart.chart"
            [xaxis]="playerChart.xaxis"
            [dataLabels]="playerChart.dataLabels"
            [grid]="playerChart.grid"
            [stroke]="playerChart.stroke"
            [colors]="playerChart.colors"
            [tooltip]="playerChart.tooltip"
            [fill]="playerChart.fill"
            [theme]="playerChart.theme"
            [yaxis]="playerChart.yaxis">
          </apx-chart>
        </div>

        <!-- ROW 1: Server Performance Gauge -->
        <div class="rust-panel p-5 flex flex-col">
          <h3 class="section-label mb-2">Engine Stress Metrics</h3>
          <div class="flex-1 flex items-center justify-center relative">
            <apx-chart
              [series]="performanceChart.series"
              [chart]="performanceChart.chart"
              [plotOptions]="performanceChart.plotOptions"
              [labels]="performanceChart.labels"
              [fill]="performanceChart.fill"
              [colors]="performanceChart.colors"
              [stroke]="performanceChart.stroke"
              [theme]="performanceChart.theme">
            </apx-chart>
          </div>
          <!-- Sub metric -->
          <div class="mt-auto grid grid-cols-2 gap-4 border-t border-[var(--color-rust-border)] pt-4">
            <div class="text-center">
              <div class="text-[10px] text-[var(--color-rust-text-muted)] uppercase mb-1">Entity Count</div>
              <div class="text-sm font-mono text-[var(--color-rust-text-primary)]">{{ data.serverStatus().entityCount | number }}</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-[var(--color-rust-text-muted)] uppercase mb-1">Net Tickrate</div>
              <div class="text-sm font-mono text-[#a3e635]">30 Hz</div>
            </div>
          </div>
        </div>

        <!-- ROW 2: Kills Per Hour (Bar) -->
        <div class="rust-panel p-5">
          <h3 class="section-label mb-4">PVP: Kills Timeflow</h3>
          <apx-chart
            [series]="killsChart.series"
            [chart]="killsChart.chart"
            [xaxis]="killsChart.xaxis"
            [plotOptions]="killsChart.plotOptions"
            [dataLabels]="killsChart.dataLabels"
            [grid]="killsChart.grid"
            [colors]="killsChart.colors"
            [tooltip]="killsChart.tooltip"
            [theme]="killsChart.theme"
            [yaxis]="killsChart.yaxis">
          </apx-chart>
        </div>

        <!-- ROW 2: Economy Resources (Donut) -->
        <div class="rust-panel p-5">
          <h3 class="section-label mb-4">Economy: Farmed Resources</h3>
          <div class="flex items-center justify-center h-full pb-4">
            <apx-chart
              [series]="resourceChart.series"
              [chart]="resourceChart.chart"
              [labels]="resourceChart.labels"
              [colors]="resourceChart.colors"
              [plotOptions]="resourceChart.plotOptions"
              [stroke]="resourceChart.stroke"
              [legend]="resourceChart.legend"
              [tooltip]="resourceChart.tooltip"
              [theme]="resourceChart.theme">
            </apx-chart>
          </div>
        </div>

        <!-- ROW 2: Weapon Meta (Radar) -->
        <div class="rust-panel p-5">
          <h3 class="section-label mb-4">Meta: Weapons by Damage</h3>
          <div class="flex items-center justify-center h-full pb-4">
            <apx-chart
              [series]="weaponChart.series"
              [chart]="weaponChart.chart"
              [xaxis]="weaponChart.xaxis"
              [yaxis]="weaponChart.yaxis"
              [stroke]="weaponChart.stroke"
              [fill]="weaponChart.fill"
              [markers]="weaponChart.markers"
              [theme]="weaponChart.theme"
              [colors]="weaponChart.colors"
              [tooltip]="weaponChart.tooltip">
            </apx-chart>
          </div>
        </div>
        
        <!-- ROW 3: HEATMAP SPAN -->
        <div class="rust-panel p-5 xl:col-span-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-label">Server Heatmap (Death Coordinates)</h3>
            <span class="text-[10px] font-mono text-[var(--color-rust-text-muted)]">Real-time mapping based on player XYZ locations</span>
          </div>
          
          <div class="relative w-full h-[400px] bg-[#1a1a1a] rounded-sm overflow-hidden border border-[var(--color-rust-border)]">
            <!-- Simulated Map Background grid -->
            <div class="absolute inset-0 z-0 opacity-10"
                 style="background-image: linear-gradient(var(--color-rust-500) 1px, transparent 1px), linear-gradient(90deg, var(--color-rust-500) 1px, transparent 1px); background-size: 50px 50px;">
            </div>
            
            <!-- Radial Heat Canvas -->
            <canvas #heatmapCanvas class="absolute inset-0 z-10 w-full h-full mix-blend-screen opacity-80"></canvas>
            
            <!-- Map Overlays mock (Text markers) -->
            <div class="absolute inset-0 z-20 pointer-events-none p-4">
              <span class="absolute top-1/4 left-1/4 text-xs font-bold text-white/40 drop-shadow-md tracking-widest font-display">RESOURCE HOLE</span>
              <span class="absolute bottom-1/3 right-1/4 text-xs font-bold text-white/40 drop-shadow-md tracking-widest font-display">RAD TOWN</span>
              <span class="absolute top-10 right-1/3 text-xs font-bold text-[var(--color-rust-text-muted)] drop-shadow-md tracking-widest font-display">HACKER VALLEY</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AnalyticsPage implements AfterViewInit {
  data = inject(MockDataService);

  period = signal<'24h' | '7d' | '30d'>('24h');

  @ViewChild('heatmapCanvas') heatmapCanvas!: ElementRef<HTMLCanvasElement>;

  // Charts Configs (any used to simplify Apex types for mock config)
  playerChart: any;
  killsChart: any;
  resourceChart: any;
  weaponChart: any;
  performanceChart: any;

  constructor() {
    this.initCharts('24h');
  }

  setPeriod(p: '24h' | '7d' | '30d') {
    this.period.set(p);
    // Real life we would fetch other data endpoints, here we just randomize the scale
    this.initCharts(p);
    this.drawHeatmap();
  }

  ngAfterViewInit() {
    // Atraso intencional mínimo para que o layout calcule o width correto antes do canvas 
    setTimeout(() => this.drawHeatmap(), 100);
  }

  private initCharts(period: string) {
    const hours = period === '24h' ? 24 : (period === '7d' ? 168 : 720);
    const filterMod = period === '24h' ? 1 : (period === '7d' ? 6 : 24); // mock resample

    // Player Count History Data
    const playersRaw = this.data.getPlayerCountHistory(hours);
    const playerSeries = playersRaw.filter((_, i) => i % filterMod === 0).map(d => [d.timestamp.getTime(), d.value]);

    const killsRaw = this.data.getKillsPerHour(hours);
    const killSeries = killsRaw.filter((_, i) => i % filterMod === 0).slice(-24); // Show last 24 ticks always

    const weapons = this.data.getWeaponStats();
    const resources = this.data.getResourceStats();

    // =============== 1. PLAYER HISTORY (AREA) ===============
    this.playerChart = {
      series: [{ name: 'Players Online', data: playerSeries }],
      chart: { type: 'area', height: 280, toolbar: { show: false }, background: 'transparent', animations: { enabled: false } },
      colors: ['#D46026'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { type: 'datetime', labels: { style: { colors: '#737373', cssClass: 'font-mono text-[10px]' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#737373', cssClass: 'font-mono text-[10px]' } } },
      grid: { borderColor: '#2E2D2B', strokeDashArray: 3, xaxis: { lines: { show: true } } },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };

    // =============== 2. KILLS PER HOUR (BAR) ===============
    this.killsChart = {
      series: [{ name: 'Kills', data: killSeries.map(d => d.value) }],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      colors: ['#B8401C'],
      plotOptions: { bar: { borderRadius: 2, columnWidth: '60%' } },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: { categories: killSeries.map(d => { const dt = new Date(d.timestamp); return dt.getHours() + ':00'; }), labels: { style: { colors: '#737373', cssClass: 'font-mono text-[9px]' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#737373', cssClass: 'font-mono text-[10px]' } } },
      grid: { borderColor: '#2E2D2B', strokeDashArray: 3, yaxis: { lines: { show: true } } },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };

    // =============== 3. ECONOMY (DONUT) ===============
    this.resourceChart = {
      series: resources.map(r => r.amount),
      chart: { type: 'donut', height: 260, background: 'transparent' },
      labels: resources.map(r => r.resource),
      colors: resources.map(r => r.color),
      plotOptions: { pie: { donut: { size: '70%', background: 'transparent', labels: { show: true, name: { show: true, color: '#737373' }, value: { show: true, color: '#e5e5e5', formatter: (val: any) => (val / 1000).toFixed(1) + 'k' } } } } },
      stroke: { show: true, colors: ['#1E1E1C'], width: 2 },
      legend: { show: false }, // Esconde a legenda para ficar mais limpo
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };

    // =============== 4. WEAPONS (RADAR) ===============
    this.weaponChart = {
      series: [{ name: 'Total Damage', data: weapons.map(w => w.damage) }],
      chart: { type: 'radar', height: 260, toolbar: { show: false }, background: 'transparent' },
      labels: weapons.map(w => w.weapon),
      colors: ['#D46026'],
      stroke: { width: 1, colors: ['#D46026'] },
      fill: { opacity: 0.3 },
      markers: { size: 3, colors: ['#fff'], strokeColors: '#D46026', strokeWidth: 1 },
      xaxis: { labels: { style: { colors: '#a3a3a3', fontSize: '9px', fontFamily: 'Share Tech Mono' } } },
      yaxis: { show: false }, // Hide internal ring numbers
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' }
    };

    // =============== 5. PERFORMANCE (RADIAL GAUGE) ===============
    const entityCapPercentage = Math.floor((this.data.serverStatus().entityCount / 50000) * 100);
    this.performanceChart = {
      series: [entityCapPercentage, 95], // Mock: 95% TPS health
      chart: { type: 'radialBar', height: 250, background: 'transparent' },
      plotOptions: {
        radialBar: {
          track: { background: '#2E2D2B', strokeWidth: '100%', margin: 5 },
          dataLabels: {
            name: { fontSize: '12px', color: '#737373', fontFamily: 'Share Tech Mono' },
            value: { fontSize: '24px', color: '#e5e5e5', fontFamily: 'Rajdhani', fontWeight: 700 }
          }
        }
      },
      labels: ['Entity Cap', 'Tick Health'],
      colors: ['#eab308', '#a3e635'],
      stroke: { lineCap: 'round' },
      theme: { mode: 'dark' }
    };
  }

  private drawHeatmap() {
    if (!this.heatmapCanvas) return;
    const canvas = this.heatmapCanvas.nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Ajusta o tamanho do canvas para o container dinâmico
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mock gerador de calor (aleatoriza N pontos do rust map)
    const points = this.period() === '24h' ? 40 : (this.period() === '7d' ? 120 : 250);
    
    for (let i = 0; i < points; i++) {
        // Rust map tend to have action around roads/radtowns. Let's cluster mock randomly.
        const focusPoint = Math.random() > 0.5 ? { cx: canvas.width * 0.7, cy: canvas.height * 0.6 } : { cx: canvas.width * 0.3, cy: canvas.height * 0.3 };
        
        const x = focusPoint.cx + (Math.random() * 200 - 100);
        const y = focusPoint.cy + (Math.random() * 200 - 100);
        const radius = Math.floor(Math.random() * 40) + 20;

        // Radial Gradient for heat dot
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        // Base color maps density: high red core, feathering out.
        grad.addColorStop(0, `rgba(220, 38, 38, ${Math.random() * 0.4 + 0.1})`); // solid red/orange inside
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
  }
}
