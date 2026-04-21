import { Component, inject, signal, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <header class="flex items-center px-4 md:px-6 h-14 border-b border-[var(--color-rust-border)] shrink-0"
            style="background: var(--color-rust-elevated)">

      <!-- Left: Hamburger (Mobile) + Server name -->
      <div class="flex items-center gap-4">
        
        <!-- Hamburger Menu Button -->
        <button class="lg:hidden p-2 -ml-2 text-[var(--color-rust-text-primary)] hover:text-[var(--color-rust-500)] transition-colors cursor-pointer"
                (click)="toggleSidebar.emit()">
          <i class="pi pi-bars text-xl"></i>
        </button>

        <div class="hidden sm:block">
          <div class="text-sm font-display font-bold uppercase tracking-wider"
               style="color: var(--color-rust-text-primary)">
            {{ server().name }}
          </div>
          <div class="text-xs font-mono mt-0.5" style="color: var(--color-rust-text-muted)">
            {{ server().version }}
          </div>
        </div>
        
        <div class="hidden sm:block h-6 w-px" style="background: var(--color-rust-border)"></div>
        
        <!-- Save countdown -->
        <div class="hidden md:flex items-center gap-2">
          <i class="pi pi-save text-xs" style="color: var(--color-rust-text-muted)"></i>
          <span class="text-xs font-mono" style="color: var(--color-rust-text-secondary)">
            Save in {{ formatSeconds(server().saveCountdownSeconds) }}
          </span>
        </div>
      </div>

      <!-- Right: Clock + admin info -->
      <div class="ml-auto flex items-center gap-3 sm:gap-5">

        <!-- Uptime -->
        <div class="hidden md:flex items-center gap-2">
          <i class="pi pi-clock text-xs" style="color: var(--color-rust-text-muted)"></i>
          <span class="text-xs font-mono" style="color: var(--color-rust-text-secondary)">
            Up {{ formatUptime(server().uptimeSeconds) }}
          </span>
        </div>

        <div class="h-6 w-px hidden md:block" style="background: var(--color-rust-border)"></div>

        <!-- Server clock -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono tabular-nums" style="color: var(--color-rust-text-primary)">{{ clock() }}</span>
        </div>

        <div class="h-6 w-px" style="background: var(--color-rust-border)"></div>

        <!-- Admin info -->
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-sm flex items-center justify-center text-white text-[10px] font-bold"
               style="background: var(--color-rust-500)">D</div>
          <div class="hidden lg:block">
            <div class="text-xs font-display font-semibold uppercase" style="color: var(--color-rust-text-primary)">Trigo</div>
            <div class="text-[10px]" style="color: var(--color-rust-500)">DEV</div>
          </div>
        </div>

      </div>
    </header>
  `,
})
export class Topbar implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  private data = inject(MockDataService);
  readonly server = this.data.serverStatus;
  clock = signal(this.getTime());

  private interval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.interval = setInterval(() => {
      this.clock.set(this.getTime());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  getTime(): string {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatSeconds(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  formatUptime(s: number): string {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}
