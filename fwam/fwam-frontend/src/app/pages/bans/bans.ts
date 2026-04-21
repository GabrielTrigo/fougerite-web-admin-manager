import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MockDataService } from '../../core/services/mock-data.service';
import { Ban } from '../../core/models/models';

@Component({
  selector: 'app-bans',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, 
    InputTextModule, IconFieldModule, InputIconModule,
    DialogModule, TagModule, TooltipModule
  ],
  template: `
    <div class="animate-rust-fade-in flex flex-col h-[calc(100vh-6rem)]">
      
      <!-- Top Actions & Filters -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 class="text-xl font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)]">
            Ban Management
          </h2>
          <p class="text-sm text-[var(--color-rust-text-muted)] mt-1">
            Manage active restrictions and view ban history.
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Search -->
          <p-iconfield class="w-64">
            <p-inputicon styleClass="pi pi-search" />
            <input pInputText type="text" placeholder="Search SteamID, Name or IP..." 
                   [(ngModel)]="searchQuery"
                   class="w-full" />
          </p-iconfield>

          <!-- Status Filter -->
          <div class="flex bg-[var(--color-rust-elevated)] rounded-sm border border-[var(--color-rust-border)] p-1">
            <button class="px-3 py-1 text-xs font-mono rounded-sm transition-colors"
                    [class]="filterStatus() === 'active' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                    (click)="filterStatus.set('active')">Active</button>
            <button class="px-3 py-1 text-xs font-mono rounded-sm transition-colors"
                    [class]="filterStatus() === 'expired' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                    (click)="filterStatus.set('expired')">Expired</button>
            <button class="px-3 py-1 text-xs font-mono rounded-sm transition-colors"
                    [class]="filterStatus() === 'all' ? 'bg-[var(--color-rust-500)] text-white' : 'text-[var(--color-rust-text-muted)] hover:text-white'"
                    (click)="filterStatus.set('all')">All</button>
          </div>

          <!-- Add Manual Ban -->
          <p-button label="Add Ban" icon="pi pi-plus" (onClick)="manualBanDialog = true"></p-button>
        </div>
      </div>

      <!-- Bans Table -->
      <div class="rust-panel overflow-x-auto w-full flex-1 flex flex-col min-h-0">
        <p-table [value]="filteredBans()" [paginator]="true" [rows]="10"
                 [rowsPerPageOptions]="[10, 25, 50]" responsiveLayout="scroll" 
                 styleClass="min-w-[1000px] flex-1 flex flex-col">
          <ng-template #header>
            <tr>
              <th style="width: 100px" class="text-center">Status</th>
              <th style="width: 250px">Player / Target</th>
              <th style="width: 150px">IP Address</th>
              <th style="width: 250px">Reason</th>
              <th style="width: 180px">Applied By</th>
              <th style="width: 100px" class="text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-ban>
            <tr [class.opacity-60]="!ban.isActive">
              <td class="text-center">
                <p-tag [severity]="ban.isActive ? 'danger' : 'success'" 
                       [value]="ban.isActive ? 'ACTIVE' : 'EXPIRED'">
                </p-tag>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-sm bg-[var(--color-rust-elevated)] border border-[var(--color-rust-border)] flex items-center justify-center text-[var(--color-rust-text-muted)]">
                    <i class="pi pi-user text-xs"></i>
                  </div>
                  <div>
                    <div class="font-bold text-[var(--color-rust-text-primary)]">{{ ban.playerName }}</div>
                    <div class="text-[10px] font-mono text-[var(--color-rust-text-muted)]">{{ ban.uid }}</div>
                  </div>
                </div>
              </td>
              <td class="font-mono text-sm text-[var(--color-rust-text-secondary)]">
                {{ ban.ip }}
              </td>
              <td>
                <div class="text-sm text-[var(--color-rust-text-primary)] truncate max-wxs" [pTooltip]="ban.reason" tooltipPosition="bottom" appendTo="body">
                  {{ ban.reason }}
                </div>
              </td>
              <td>
                <div class="text-sm font-semibold text-[var(--color-rust-text-secondary)]">{{ ban.bannedBy }}</div>
                <div class="text-[10px] text-[var(--color-rust-text-muted)] font-mono">
                  {{ ban.bannedAt | date:'dd MMM yyyy, HH:mm' }}
                </div>
              </td>
              <td class="text-right">
                <p-button icon="pi pi-unlock" 
                          severity="secondary" 
                          size="small" 
                          pTooltip="Pardon (Unban)" 
                          tooltipPosition="left"
                          appendTo="body"
                          [disabled]="!ban.isActive"
                          (onClick)="confirmUnban(ban)"></p-button>
              </td>
            </tr>
          </ng-template>
          
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center p-8">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <i class="pi pi-shield text-4xl mb-3 text-[var(--color-rust-text-muted)]"></i>
                  <p class="text-[var(--color-rust-text-secondary)]">No bans found matching the criteria.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

    </div>

    <!-- ── DIALOGS ── -->

    <!-- Manual Ban Dialog -->
    <p-dialog [(visible)]="manualBanDialog" [modal]="true" header="Manual Restrict" [style]="{ width: '28rem' }" appendTo="body">
      <span class="text-xs text-[var(--color-rust-text-muted)] block mb-4">
        Apply a manual ban bypassing the in-game state. You must provide at least an IP or SteamID.
      </span>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-display uppercase font-semibold">SteamID (UID)</label>
            <input pInputText [(ngModel)]="newBanData.uid" placeholder="7656119..." class="font-mono text-sm" autocomplete="off" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs font-display uppercase font-semibold">IP Address</label>
            <input pInputText [(ngModel)]="newBanData.ip" placeholder="0.0.0.0" class="font-mono text-sm" autocomplete="off" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-display uppercase font-semibold">Player Name (Optional)</label>
          <input pInputText [(ngModel)]="newBanData.playerName" placeholder="Unknown..." autocomplete="off" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-display uppercase font-semibold">Reason</label>
          <input pInputText [(ngModel)]="newBanData.reason" placeholder="E.g., Association with cheaters" autocomplete="off" />
        </div>
      </div>

      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" (onClick)="manualBanDialog = false"></p-button>
        <p-button label="Execute Ban" severity="danger" (onClick)="executeManualBan()"></p-button>
      </ng-template>
    </p-dialog>


    <!-- Unban Confirmation Dialog -->
    <p-dialog [(visible)]="unbanDialog" [modal]="true" header="Pardon Player" [style]="{ width: '25rem' }" appendTo="body">
      @if (selectedBan) {
        <span class="text-sm text-[var(--color-rust-text-primary)] block mb-4">
          Are you sure you want to lift the ban on <strong class="text-[var(--color-rust-500)]">{{ selectedBan.playerName }}</strong>?
        </span>
        <div class="rust-panel p-3 mb-2 bg-[var(--color-rust-base)] border-[var(--color-rust-border)]">
          <div class="text-xs text-[var(--color-rust-text-muted)]">Reason:</div>
          <div class="text-sm text-[var(--color-rust-text-secondary)] italic">"{{ selectedBan.reason }}"</div>
        </div>
        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" (onClick)="unbanDialog = false"></p-button>
          <p-button label="Pardon" (onClick)="executeUnban()"></p-button>
        </ng-template>
      }
    </p-dialog>

  `
})
export class BansPage {
  data = inject(MockDataService);

  // Filters
  searchQuery = signal('');
  filterStatus = signal<'active' | 'expired' | 'all'>('active');

  // Computed display data
  filteredBans = computed(() => {
    let list = this.data.bans();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.filterStatus();

    if (status === 'active') list = list.filter(b => b.isActive);
    if (status === 'expired') list = list.filter(b => !b.isActive);

    if (query) {
      list = list.filter(b => 
        b.playerName.toLowerCase().includes(query) ||
        b.uid.toLowerCase().includes(query) ||
        b.ip.includes(query)
      );
    }

    return list;
  });

  // Unban Flow
  unbanDialog = false;
  selectedBan: Ban | null = null;

  confirmUnban(ban: Ban) {
    this.selectedBan = ban;
    this.unbanDialog = true;
  }

  executeUnban() {
    if (this.selectedBan) {
      this.data.unbanPlayer(this.selectedBan.id);
      this.unbanDialog = false;
      this.selectedBan = null;
    }
  }

  // Manual Ban Flow
  manualBanDialog = false;
  newBanData: Partial<Ban> = {};

  executeManualBan() {
    if (!this.newBanData.uid && !this.newBanData.ip) {
      alert("You must provide at least a SteamID or an IP address.");
      return;
    }
    
    this.data.addManualBan(this.newBanData);
    this.manualBanDialog = false;
    this.newBanData = {};
  }
}
