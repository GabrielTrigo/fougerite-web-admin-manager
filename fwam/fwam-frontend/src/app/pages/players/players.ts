import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventService } from '../../core/services/event.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { Player } from '../../core/models/models';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-players',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    DialogModule,
    TagModule,
    SelectModule,
    DrawerModule
  ],
  template: `
    <div class="animate-rust-fade-in space-y-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl m-0" style="font-family: var(--font-rust-display); color: var(--color-rust-text-primary)">
            Player Management
          </h1>
          <p class="text-xs mt-1 m-0" style="color: var(--color-rust-text-muted); font-family: var(--font-rust-mono)">
            Total of {{ totalRecords() }} players recorded in history
          </p>
        </div>

        <div class="flex items-center gap-3">
          <p-iconfield class="w-64">
            <p-inputicon class="pi pi-search" />
            <input pInputText type="text" placeholder="Search by Name or SteamID..."
                   [ngModel]="searchTerm()" (ngModelChange)="onSearchChange($event)"
                   class="w-full" />
          </p-iconfield>
        </div>
      </div>

      <!-- Main Table -->
      <div class="rust-panel overflow-x-auto w-full">
        <p-table [value]="allPlayers()" [paginator]="true" [rows]="rows()" [first]="first()"
                 [totalRecords]="totalRecords()" [lazy]="true" (onLazyLoad)="onLazyLoad($event)"
                 [rowsPerPageOptions]="[10, 25, 50, 100]" [loading]="loading()"
                 responsiveLayout="scroll" styleClass="min-w-[800px]">
          <ng-template #header>
            <tr>
              <th style="width: 60px" class="text-center">Avatar</th>
              <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
              <th>SteamID</th>
              <th pSortableColumn="ping">Ping <p-sortIcon field="ping" /></th>
              <th>Location</th>
              <th pSortableColumn="timeOnline">Time Online <p-sortIcon field="timeOnline" /></th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-player>
            <tr class="border-b border-[var(--color-rust-border)] hover:bg-[var(--color-rust-overlay)] transition-colors" [class.opacity-50]="!player.isConnected">
              <td class="text-center px-4 py-3 border-r border-[var(--color-rust-border)]">
                <img [src]="player.avatarUrl" alt="Avatar"
                     class="w-7 h-7 rounded-sm shrink-0 bg-[var(--color-rust-elevated)] border border-[var(--color-rust-border)] mx-auto" />
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)] font-display font-semibold text-sm">
                <div class="flex items-center gap-2">
                  <span [style.color]="player.isAdmin ? 'var(--color-rust-500)' : 'var(--color-rust-text-primary)'">
                    {{ player.name }}
                  </span>
                  @if (player.isAdmin) {
                    <i class="pi pi-shield text-[10px]" style="color: var(--color-rust-500)" pTooltip="Server Admin" appendTo="body"></i>
                  }
                </div>
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)] font-mono text-xs" style="color: var(--color-rust-text-secondary)">
                {{ player.steamId }}
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)] font-mono text-xs">
                <span class="flex items-center gap-1" [class]="getPingClass(player.ping)">
                  <i class="pi pi-wifi text-[10px]"></i> {{ player.ping }}
                </span>
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)] font-mono text-[11px]" style="color: var(--color-rust-text-muted)">
                [ {{ player.location.x | number:'1.0-0' }} , {{ player.location.y | number:'1.0-0' }} , {{ player.location.z | number:'1.0-0' }} ]
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)] text-xs" style="color: var(--color-rust-text-primary)">
                {{ formatTimeOnline(player.timeOnline) }}
              </td>
              <td class="px-4 py-3 border-r border-[var(--color-rust-border)]">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm"
                      [class]="player.isConnected 
                        ? 'bg-[var(--color-rust-success)]/20 text-[var(--color-rust-success-light)] border border-[var(--color-rust-success)]' 
                        : 'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-muted)] border border-[var(--color-rust-border)]'">
                  {{ player.isConnected ? 'Online' : 'Offline' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button [disabled]="!player.isConnected" class="w-7 h-7 flex items-center justify-center rounded-sm bg-(--color-rust-surface) border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-[var(--color-rust-text-primary)] transition-colors cursor-pointer" 
                          pTooltip="Details" tooltipPosition="left" appendTo="body" (click)="openDetails(player)">
                    <i class="pi pi-align-left text-xs"></i>
                  </button>
                  <button [disabled]="!player.isConnected" class="w-7 h-7 flex items-center justify-center rounded-sm bg-(--color-rust-surface) border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-[var(--color-rust-500)] transition-colors cursor-pointer" 
                          pTooltip="Give Item" tooltipPosition="left" appendTo="body" (click)="openGive(player)">
                    <i class="pi pi-box text-xs"></i>
                  </button>
                  <button [disabled]="!player.isConnected" class="w-7 h-7 flex items-center justify-center rounded-sm bg-(--color-rust-surface) border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-[var(--color-rust-500)] transition-colors cursor-pointer" 
                          pTooltip="Teleport" tooltipPosition="left" appendTo="body" (click)="openTeleport(player)">
                    <i class="pi pi-send text-xs"></i>
                  </button>
                  <button [disabled]="!player.isConnected" class="w-7 h-7 flex items-center justify-center rounded-sm bg-(--color-rust-surface) border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-danger-glow)] hover:border-[var(--color-rust-danger)] hover:text-[var(--color-rust-danger-light)] transition-colors cursor-pointer" 
                          pTooltip="Kick" tooltipPosition="left" appendTo="body" (click)="openKick(player)">
                    <i class="pi pi-sign-out text-xs"></i>
                  </button>
                  <button [disabled]="!player.isConnected" class="w-7 h-7 flex items-center justify-center rounded-sm bg-(--color-rust-danger-glow) border border-[var(--color-rust-danger)] text-[var(--color-rust-danger-light)] hover:bg-[var(--color-rust-danger)] hover:text-white transition-colors cursor-pointer" 
                          pTooltip="Ban" tooltipPosition="left" appendTo="body" (click)="openBan(player)">
                    <i class="pi pi-ban text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="8">
                <div class="flex flex-col items-center justify-center py-12 opacity-50">
                  <i class="pi pi-inbox text-4xl mb-4" style="color: var(--color-rust-text-muted)"></i>
                  <span>No players found matching your criteria.</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

    </div>

    <!-- ── DIALOGS ── -->

    <!-- Kick Dialog -->
    <p-dialog [visible]="kickDialog()" (visibleChange)="kickDialog.set($event)" [modal]="true" header="Kick Player" [style]="{ width: '25rem' }" appendTo="body">
      @if (selectedPlayer()) {
        <span class="text-xs text-[var(--color-rust-text-muted)] block mb-4">
          Kicking <strong class="text-[var(--color-rust-danger-light)]">{{ selectedPlayer()?.name }}</strong> from the server.
        </span>
        <div class="flex flex-col gap-2">
          <label for="kickReason" class="text-xs font-display uppercase font-semibold">Reason</label>
          <input pInputText id="kickReason" [(ngModel)]="actionReason" autocomplete="off" placeholder="E.g., High ping, trolling..." />
        </div>
        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" (onClick)="kickDialog.set(false)" />
          <p-button label="Execute Kick" severity="danger" (onClick)="executeKick()" />
        </ng-template>
      }
    </p-dialog>

    <!-- Ban Dialog -->
    <p-dialog [visible]="banDialog()" (visibleChange)="banDialog.set($event)" [modal]="true" header="Ban Player" [style]="{ width: '28rem' }" appendTo="body">
      @if (selectedPlayer()) {
        <span class="text-xs text-[var(--color-rust-text-muted)] block mb-4">
          Permanently ban <strong class="text-[var(--color-rust-danger-light)]">{{ selectedPlayer()?.name }}</strong>.
        </span>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-display uppercase font-semibold">Targets</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-xs">
                <input type="checkbox" checked disabled class="accent-[var(--color-rust-danger)]" />
                SteamID ({{ selectedPlayer()?.steamId }})
              </label>
              <label class="flex items-center gap-2 text-xs">
                <input type="checkbox" [(ngModel)]="banIp" class="accent-[var(--color-rust-danger)]" />
                IP Address ({{ selectedPlayer()?.ip }})
              </label>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="banReason" class="text-xs font-display uppercase font-semibold">Reason (Public)</label>
            <input pInputText id="banReason" [(ngModel)]="actionReason" autocomplete="off" placeholder="E.g., Cheating, toxicity..." />
          </div>
        </div>

        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" (onClick)="banDialog.set(false)" />
          <p-button label="Ban Target" severity="danger" (onClick)="executeBan()" />
        </ng-template>
      }
    </p-dialog>

    <!-- Give Item Dialog -->
    <p-dialog [visible]="giveDialog()" (visibleChange)="giveDialog.set($event)" [modal]="true" header="Give Item" [style]="{ width: '25rem' }" appendTo="body">
      @if (selectedPlayer()) {
        <span class="text-xs text-[var(--color-rust-text-muted)] block mb-4">
          Giving items to <strong class="text-[var(--color-rust-500)]">{{ selectedPlayer()?.name }}</strong>.
        </span>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-display uppercase font-semibold">Item</label>
            <p-select [options]="availableItems()" [(ngModel)]="selectedItem" placeholder="Select an Item" appendTo="body" class="w-full" [filter]="true" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-display uppercase font-semibold">Amount</label>
            <input pInputText type="number" [(ngModel)]="itemAmount" class="w-24 font-mono" min="1" max="1000" />
          </div>
        </div>
        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" (onClick)="giveDialog.set(false)" />
          <p-button label="Grant Item" (onClick)="executeGive()" />
        </ng-template>
      }
    </p-dialog>

    <!-- Details Sidebar (Custom Tailwind Drawer) -->
    @if (detailsPanel()) {
      <div class="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex justify-end transition-opacity animate-rust-fade-in" (click)="detailsPanel.set(false)">
        
        <div class="h-full w-[28rem] bg-[var(--color-rust-base)] border-l border-[var(--color-rust-border)] shadow-2xl flex flex-col"
             (click)="$event.stopPropagation()">
             
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)]">
            <div class="flex items-center gap-3">
              <img [src]="selectedPlayer()?.avatarUrl" class="w-10 h-10 rounded-sm bg-[var(--color-rust-elevated)] border border-[var(--color-rust-border)]" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)] text-lg">
                    {{ selectedPlayer()?.name || 'Unknown' }}
                  </span>
                  @if (selectedPlayer()?.isAdmin) {
                    <i class="pi pi-shield text-xs" style="color: var(--color-rust-500)"></i>
                  }
                </div>
                <div class="text-xs font-mono" style="color: var(--color-rust-text-muted)">
                  {{ selectedPlayer()?.steamId }} | {{ selectedPlayer()?.ip }}
                </div>
              </div>
            </div>
            <button class="w-7 h-7 flex items-center justify-center rounded-sm text-[var(--color-rust-text-muted)] hover:text-[var(--color-rust-text-primary)] hover:bg-[var(--color-rust-overlay)] transition-colors duration-100 cursor-pointer border-0 bg-transparent" (click)="detailsPanel.set(false)">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="px-5 py-4 overflow-y-auto flex-1 text-[var(--color-rust-text-primary)]">
            @if (selectedPlayer()) {
              <div class="flex flex-col gap-6">
                <!-- Stats -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="rust-panel p-3">
                    <span class="section-label block mb-1">Health</span>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 rounded-sm bg-[var(--color-rust-border)] overflow-hidden">
                        <div class="h-full bg-[var(--color-rust-success-light)]" [style.width.%]="selectedPlayer()?.health"></div>
                      </div>
                      <span class="font-mono text-xs text-[var(--color-rust-text-primary)]">{{ selectedPlayer()?.health }}</span>
                    </div>
                  </div>
                  <div class="rust-panel p-3">
                    <span class="section-label block mb-1">Session</span>
                    <span class="font-mono text-sm text-[var(--color-rust-text-primary)]">{{ formatTimeOnline(selectedPlayer()!.timeOnline) }}</span>
                  </div>
                </div>

                <!-- Inventory Mock -->
                <div>
                  <div class="flex flex-col gap-2">
                    <span class="section-label">Main Inventory</span>
                    <div class="grid grid-cols-6 gap-1 bg-[var(--color-rust-elevated)] p-2 rounded-sm border border-[var(--color-rust-border)]">
                      @for (slot of [].constructor(30); track $index) {
                        <div class="aspect-square bg-[var(--color-rust-base)] border border-[var(--color-rust-border)] flex items-center justify-center relative hover:border-[var(--color-rust-500)] transition-colors cursor-pointer group">
                          @if ($index === 4) {
                            <div class="w-2/3 h-2/3 bg-[#8B5E3C] rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <span class="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold text-white shadow-sm">250</span>
                          }
                          @if ($index === 11) {
                            <div class="w-1/2 h-2/3 bg-[#9E9E9E] rounded-sm opacity-80 group-hover:opacity-100 transition-opacity border-t border-r border-[#D4C526]"></div>
                            <span class="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold text-white shadow-sm">1</span>
                          }
                          @if ($index === 15) {
                            <div class="w-2/3 h-1/2 bg-[#A5B553] rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <span class="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold text-white shadow-sm">15</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 mt-4">
                    <span class="section-label">Belt</span>
                    <div class="grid grid-cols-6 gap-1 bg-[var(--color-rust-elevated)] p-2 rounded-sm border border-[var(--color-rust-border)]">
                      @for (slot of [].constructor(6); track $index) {
                        <div class="aspect-square bg-[var(--color-rust-base)] border border-[var(--color-rust-border)] flex items-center justify-center relative hover:border-[var(--color-rust-500)] transition-colors cursor-pointer group">
                          @if ($index === 0) {
                            <div class="w-1/3 h-5/6 bg-[#4A4A4A] rounded-sm border-t-4 border-[#1A1A1A]"></div>
                          }
                          @if ($index === 1) {
                            <div class="w-1/2 h-1/2 bg-[#D46026] rounded-full"></div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="flex items-center gap-2 mt-auto px-5 py-4 bg-[var(--color-rust-surface)] border-t border-[var(--color-rust-border)] justify-end">
            <p-button label="Close" severity="secondary" (onClick)="detailsPanel.set(false)" />
          </div>
        </div>
        
      </div>
    }
  `
})
export class PlayersPage {
  private eventService = inject(EventService);
  private adminApi = inject(AdminApiService);

  readonly allPlayers = this.eventService.allPlayers;
  
  // Pagination & Search State
  searchTerm = signal('');
  loading = signal(false);
  totalRecords = signal(0);
  rows = signal(10);
  first = signal(0);
  
  // UI State (Signals)
  availableItems = signal<string[]>([]);

  // UI State (Signals)
  kickDialog = signal(false);
  banDialog = signal(false);
  giveDialog = signal(false);
  detailsPanel = signal(false);
  
  // Selection/Input State
  selectedPlayer = signal<Player | null>(null);
  actionReason = '';
  banIp = true;
  selectedItem: string | null = null;
  itemAmount = 1;

  ngOnInit() {
    this.refreshItemList();
    // Initial fetch handled by onLazyLoad
  }

  refreshItemList() {
    this.adminApi.getGameItems().subscribe(items => {
      this.availableItems.set(items);
    });
  }

  onLazyLoad(event: any) {
    this.first.set(event.first || 0);
    this.rows.set(event.rows || 10);
    this.refreshPlayers();
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.first.set(0); // Reset pagination on search
    this.refreshPlayers();
  }

  refreshPlayers() {
    this.loading.set(true);
    const page = Math.floor(this.first() / this.rows());
    
    this.adminApi.getPlayers(page, this.rows(), this.searchTerm()).subscribe({
      next: (res: any) => {
        this.totalRecords.set(res.total);
        
        const mappedPlayers: Player[] = res.players.map((p: any) => ({
          uid: p.steamId,
          name: p.name,
          steamId: p.steamId,
          ping: 0, // Ping is only for online (will be updated via events if online)
          health: 100,
          location: { x: 0, y: 0, z: 0 },
          timeOnline: 0,
          isAdmin: false,
          isDev: false,
          isBleeding: false,
          isConnected: p.isOnline,
          ip: p.ipAddress || '0.0.0.0',
          connectedAt: new Date(p.lastConnection),
          avatarUrl: p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
        }));

        this.eventService.allPlayers.set(mappedPlayers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[FWAM] Error fetching players:', err);
        this.loading.set(false);
      }
    });
  }

  getPingClass(ping: number): string {
    if (ping < 80) return 'text-[var(--color-rust-success-light)]';
    if (ping < 150) return 'text-[var(--color-rust-warning-light)]';
    return 'text-[var(--color-rust-danger-light)]';
  }

  formatTimeOnline(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  openDetails(p: Player) {
    this.selectedPlayer.set(p);
    this.detailsPanel.set(true);
  }

  openTeleport(p: Player) {
    this.adminApi.sendCommand('TELEPORT', p.uid, '4937.54,385.44,-4894.84').subscribe(() => {
      console.log(`[API] Teleport command sent for ${p.name}`);
    });
  }

  openKick(p: Player) {
    this.selectedPlayer.set(p);
    this.actionReason = '';
    this.kickDialog.set(true);
  }

  openBan(p: Player) {
    this.selectedPlayer.set(p);
    this.actionReason = '';
    this.banIp = true;
    this.banDialog.set(true);
  }

  openGive(p: Player) {
    this.selectedPlayer.set(p);
    this.selectedItem = null;
    this.itemAmount = 1;
    this.giveDialog.set(true);
  }

  executeKick() {
    const p = this.selectedPlayer();
    if (!p) return;

    this.adminApi.kick(p.uid, this.actionReason).subscribe(() => {
      this.kickDialog.set(false);
    });
  }

  executeBan() {
    const p = this.selectedPlayer();
    if (!p) return;

    this.adminApi.sendCommand('BAN', p.uid, this.actionReason).subscribe(() => {
      this.banDialog.set(false);
    });
  }

  executeGive() {
    const p = this.selectedPlayer();
    if (!p || !this.selectedItem) return;

    const arg = `${this.selectedItem},${this.itemAmount}`;
    this.adminApi.sendCommand('GIVE', p.uid, arg).subscribe(() => {
      this.giveDialog.set(false);
    });
  }
}
