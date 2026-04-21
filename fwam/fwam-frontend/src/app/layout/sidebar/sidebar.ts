import { Component, inject, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="flex flex-col h-full w-60 border-r border-[var(--color-rust-border)]"
      style="background: var(--color-rust-surface)">

      <!-- Logo / Brand -->
      <div class="px-5 py-4 border-b border-[var(--color-rust-border)] shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-sm flex items-center justify-center shadow-lg"
               style="background: var(--color-rust-500)">
            <span class="text-white font-bold text-xs tracking-tight">FW</span>
          </div>
          <div>
            <div class="font-display font-bold text-sm tracking-[0.15em] uppercase"
                 style="color: var(--color-rust-text-primary)">FWAM</div>
            <div class="text-[10px] tracking-wider font-mono text-[var(--color-rust-text-muted)]">Admin Manager v1.0</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto w-full">

        <div class="px-5 mb-2">
          <span class="text-[10px] uppercase font-bold text-[var(--color-rust-text-muted)] tracking-widest w-full block border-b border-[var(--color-rust-border)] pb-1">Core Server</span>
        </div>

        @for (item of serverNav; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-link-active"
             (click)="navigateOut.emit()"
             class="nav-link flex items-center gap-3 px-4 py-2.5 mx-3 rounded-sm transition-all duration-100 cursor-pointer group mb-1">
            <i [class]="'pi ' + item.icon + ' text-sm w-4 text-center'"></i>
            <span class="text-xs font-display font-semibold uppercase tracking-wider">{{ item.label }}</span>
            @if (item.badge) {
              <span class="ml-auto px-1.5 py-0.5 text-[9px] rounded-sm font-mono shadow-md"
                    style="background: var(--color-rust-danger); color: white">{{ item.badge }}</span>
            }
          </a>
        }

        <div class="px-5 mb-2 mt-6">
           <span class="text-[10px] uppercase font-bold text-[var(--color-rust-text-muted)] tracking-widest w-full block border-b border-[var(--color-rust-border)] pb-1">Intelligence</span>
        </div>

        @for (item of analyticsNav; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-link-active"
             (click)="navigateOut.emit()"
             class="nav-link flex items-center gap-3 px-4 py-2.5 mx-3 rounded-sm transition-all duration-100 cursor-pointer group mb-1">
            <i [class]="'pi ' + item.icon + ' text-sm w-4 text-center'"></i>
            <span class="text-xs font-display font-semibold uppercase tracking-wider">{{ item.label }}</span>
            @if (item.badge) {
              <span class="ml-auto px-1.5 py-0.5 text-[9px] rounded-sm font-mono shadow-md"
                    style="background: var(--color-rust-danger); color: white">{{ item.badge }}</span>
            }
          </a>
        }

        <div class="px-5 mb-2 mt-6">
           <span class="text-[10px] uppercase font-bold text-[var(--color-rust-text-muted)] tracking-widest w-full block border-b border-[var(--color-rust-border)] pb-1">System Environment</span>
        </div>

        @for (item of systemNav; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-link-active"
             (click)="navigateOut.emit()"
             class="nav-link flex items-center gap-3 px-4 py-2.5 mx-3 rounded-sm transition-all duration-100 cursor-pointer group mb-3">
            <i [class]="'pi ' + item.icon + ' text-sm w-4 text-center'"></i>
            <span class="text-xs font-display font-semibold uppercase tracking-wider">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Server Status Footer -->
      <div class="px-4 py-3 border-t border-[var(--color-rust-border)] shrink-0"
           style="background: var(--color-rust-elevated)">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-display font-bold uppercase tracking-widest text-[10px] text-[var(--color-rust-text-secondary)]">Server Hook</span>
          <span class="text-[10px] font-mono font-bold flex items-center gap-1"
                [class]="server().isOnline ? 'text-[var(--color-rust-success-light)]' : 'text-[var(--color-rust-danger-light)]'">
            <span class="w-1.5 h-1.5 rounded-full inline-block animate-rust-pulse"
                  [style.background]="server().isOnline ? 'var(--color-rust-success-light)' : 'var(--color-rust-danger-light)'"></span>
            {{ server().isOnline ? 'ONLINE' : 'OFFLINE' }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold" style="color: var(--color-rust-text-muted)">Players</span>
          <span class="text-xs font-mono font-bold" style="color: var(--color-rust-text-primary)">
            {{ server().currentPlayers }}/{{ server().maxPlayers }}
          </span>
        </div>
        <!-- Player bar -->
        <div class="mt-2 h-1 rounded-full overflow-hidden" style="background: var(--color-rust-border)">
          <div class="h-full rounded-full transition-all duration-500"
               style="background: var(--color-rust-500)"
               [style.width.%]="(server().currentPlayers / server().maxPlayers) * 100">
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .nav-link {
      color: var(--color-rust-text-muted);
    }
    .nav-link:hover {
      background: var(--color-rust-overlay);
      color: var(--color-rust-text-primary);
    }
    .nav-link:hover i {
      color: var(--color-rust-500);
    }
    .nav-link-active {
      background: var(--color-rust-glow) !important;
      color: var(--color-rust-text-primary) !important;
      border-left: 2px solid var(--color-rust-500);
    }
    .nav-link-active i {
      color: var(--color-rust-500) !important;
    }
  `]
})
export class Sidebar {
  @Output() navigateOut = new EventEmitter<void>();

  private data = inject(MockDataService);
  readonly server = this.data.serverStatus;

  readonly serverNav: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home',    route: '/dashboard' },
    { label: 'Live Map',  icon: 'pi-map',     route: '/map' },
    { label: 'Players',   icon: 'pi-users',   route: '/players',   badge: 0 },
    { label: 'Chat',      icon: 'pi-comments',route: '/chat' },
    { label: 'Bans',      icon: 'pi-ban',     route: '/bans',      badge: 5 },
  ];

  readonly analyticsNav: NavItem[] = [
    { label: 'Analytics',  icon: 'pi-chart-line',  route: '/analytics' },
    { label: 'Security',   icon: 'pi-shield',      route: '/security',  badge: 2 },
    { label: 'Automation', icon: 'pi-clock',       route: '/automation' },
  ];

  readonly systemNav: NavItem[] = [
    { label: 'Settings', icon: 'pi-cog', route: '/settings' },
  ];
}
