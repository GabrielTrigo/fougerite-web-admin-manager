import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, ToggleSwitchModule],
  template: `
    <div class="animate-rust-fade-in flex flex-col h-[calc(100vh-6rem)]">
      
      <!-- Top Header & Lockdown Bar -->
      <div class="mb-6 shrink-0">
        <h2 class="text-xl font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)]">
          Security Operations Center
        </h2>
        <p class="text-sm text-[var(--color-rust-text-muted)] mt-1">
          Monitor anomalies, audit staff commands, and ban network threats.
        </p>

        <!-- Whitelist / Lockdown Toggle -->
        <div class="mt-4 p-4 rounded-sm border transition-colors duration-300"
             [ngClass]="data.serverWhitelist() ? 'bg-red-900/10 border-[var(--color-rust-danger)]' : 'bg-[var(--color-rust-elevated)] border-[var(--color-rust-border)]'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3" [ngClass]="data.serverWhitelist() ? 'text-[var(--color-rust-danger)]' : 'text-[var(--color-rust-text-primary)]'">
              <i class="pi" [ngClass]="data.serverWhitelist() ? 'pi-lock' : 'pi-unlock'" style="font-size: 1.5rem;"></i>
              <div>
                <h3 class="font-display font-bold uppercase tracking-wide text-sm">Server Lockdown (Whitelist Mode)</h3>
                <p class="text-xs text-[var(--color-rust-text-muted)] mt-0.5">
                  @if(data.serverWhitelist()) {
                    <span class="text-[var(--color-rust-danger-light)]">Lockdown active! Unknown hardware/IPs will be dropped at handshake.</span>
                  } @else {
                    Public mode. Anyone with the game client can connect to the port.
                  }
                </p>
              </div>
            </div>
            
            <p-toggleSwitch
              [ngModel]="data.serverWhitelist()" 
              (ngModelChange)="data.toggleWhitelistMode($event)">
            </p-toggleSwitch>
          </div>
        </div>
      </div>

      <!-- Main Columns (Stretched Layout) -->
      <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        <!-- Left Col: Live Security Event Feed -->
        <div class="lg:w-1/3 flex flex-col rust-panel overflow-hidden">
          <div class="p-4 border-b border-[var(--color-rust-border)] flex items-center justify-between bg-[var(--color-rust-elevated)]">
            <h3 class="font-display font-bold uppercase text-sm tracking-wider flex items-center gap-2">
              <i class="pi pi-bolt text-[var(--color-rust-warning)]"></i> Live Threat Feed
            </h3>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[var(--color-rust-surface)] text-[var(--color-rust-text-secondary)] border border-[var(--color-rust-border)]">
              {{ data.gameEvents().length }} EVENTS
            </span>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
            <!-- Fade line at top -->
            <div class="sticky top-0 h-4 bg-gradient-to-b from-[var(--color-rust-base)] to-transparent w-full z-10 pointer-events-none -mt-4"></div>
            
            @for (event of data.gameEvents(); track event.id) {
              <div class="p-3 rounded-sm border-l-4 text-sm font-mono transition-all hover:bg-[var(--color-rust-elevated)]"
                   [ngClass]="{
                     'border-l-[var(--color-rust-warning)] bg-[var(--color-rust-warning)]/5 text-[var(--color-rust-text-primary)]': event.severity === 'warning',
                     'border-l-[var(--color-rust-danger)] bg-[var(--color-rust-danger)]/10 text-[var(--color-rust-danger-light)]': event.severity === 'danger',
                     'border-l-[var(--color-rust-500)] bg-[var(--color-rust-500)]/5 text-[var(--color-rust-text-primary)]': event.severity === 'info'
                   }">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <i class="pi" [ngClass]="{
                      'pi-exclamation-triangle text-[var(--color-rust-warning)]': event.severity === 'warning',
                      'pi-shield text-[var(--color-rust-danger)]': event.severity === 'danger',
                      'pi-info-circle text-[var(--color-rust-500)]': event.severity === 'info'
                    }"></i>
                    {{ event.type }}
                  </span>
                  <span class="text-[10px] text-[var(--color-rust-text-muted)]">{{ event.timestamp | date:'HH:mm:ss' }}</span>
                </div>
                <!-- Content text -->
                <p class="text-xs break-words">
                  @if(event.playerName) { <strong class="text-white">{{ event.playerName }}</strong> }
                  {{ event.message }}
                </p>
              </div>
            } @empty {
              <div class="text-center p-8 text-[var(--color-rust-text-muted)] text-xs italic">
                No security alerts detected.
              </div>
            }
          </div>
        </div>

        <!-- Right Col: Stacked IP Blacklist & Admin Logs -->
        <div class="lg:w-2/3 flex flex-col gap-6 overflow-y-auto">
          
          <!-- IP Blacklist Table Panel -->
          <div class="rust-panel flex flex-col shrink-0">
            <div class="p-4 border-b border-[var(--color-rust-border)] flex items-center justify-between">
              <div>
                <h3 class="font-display font-bold uppercase text-sm tracking-wider">Firewall / IP Blacklist</h3>
                <p class="text-[10px] text-[var(--color-rust-text-muted)] mt-0.5">Drop layer-4 connections instantly.</p>
              </div>
              
              <!-- Inline Add IP Form -->
              <div class="flex items-center gap-2">
                <input type="text" pInputText placeholder="192.168.0.1" [(ngModel)]="newIpAddress" class="w-32 !py-1 !px-2 !text-xs">
                <input type="text" pInputText placeholder="Reason..." [(ngModel)]="newIpReason" class="w-32 !py-1 !px-2 !text-xs">
                <p-button icon="pi pi-plus" size="small" [disabled]="!newIpAddress || !newIpReason" (onClick)="submitIpBan()"></p-button>
              </div>
            </div>

            <p-table [value]="data.ipBlacklist()" [paginator]="true" [rows]="4" responsiveLayout="scroll" styleClass="w-full text-xs">
              <ng-template #header>
                <tr>
                  <th style="width: 150px">IP Address</th>
                  <th>Reason</th>
                  <th style="width: 150px">Date Added</th>
                  <th style="width: 60px" class="text-center">Action</th>
                </tr>
              </ng-template>
              <ng-template #body let-block>
                <tr>
                  <td class="font-mono font-bold text-[var(--color-rust-danger-light)]">{{ block.ip }}</td>
                  <td class="text-[var(--color-rust-text-secondary)]">{{ block.reason }}</td>
                  <td class="font-mono text-[var(--color-rust-text-muted)]">{{ block.addedAt | date:'dd MMM, HH:mm' }}</td>
                  <td class="text-center">
                    <p-button icon="pi pi-trash" severity="secondary" size="small" [text]="true" (onClick)="data.removeIpBlacklist(block.id)"></p-button>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr><td colspan="4" class="text-center p-4 text-[var(--color-rust-text-muted)] italic">No IP rules found.</td></tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Admin Audit Trail Panel -->
          <div class="rust-panel flex flex-col shrink-0">
            <div class="p-4 border-b border-[var(--color-rust-border)]">
              <h3 class="font-display font-bold uppercase text-sm tracking-wider">Admin Action Audit Trail</h3>
              <p class="text-[10px] text-[var(--color-rust-text-muted)] mt-0.5">Logs every command executed by staff members with privileges.</p>
            </div>
            
            <p-table [value]="data.auditLog()" [paginator]="true" [rows]="5" responsiveLayout="scroll" styleClass="w-full text-xs">
              <ng-template #header>
                <tr>
                  <th style="width: 160px">Date / IP</th>
                  <th style="width: 140px">Admin</th>
                  <th style="width: 100px">Action</th>
                  <th>Target / Details</th>
                </tr>
              </ng-template>
              <ng-template #body let-audit>
                <tr class="hover:bg-[var(--color-rust-overlay)] transition-colors">
                  <td class="font-mono">
                     <div class="text-[var(--color-rust-text-primary)] font-semibold">{{ audit.timestamp | date:'dd MMM, HH:mm:ss' }}</div>
                     <div class="text-[10px] text-[var(--color-rust-text-muted)]">{{ audit.ipAddress }}</div>
                  </td>
                  <td class="font-mono text-[#a3e635]">{{ audit.adminName }}</td>
                  <td>
                    <span class="px-1.5 py-0.5 border border-[var(--color-rust-border-accent)] rounded-sm bg-black/20 text-[10px] font-bold uppercase tracking-wider text-[var(--color-rust-text-secondary)]">
                      {{ audit.action }}
                    </span>
                  </td>
                  <td>
                    @if(audit.target) { <span class="font-bold text-[var(--color-rust-500)] mr-2">{{ audit.target }}</span> }
                    <span class="text-[var(--color-rust-text-muted)] italic">{{ audit.details }}</span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

        </div>

      </div>
    </div>
  `
})
export class SecurityPage {
  data = inject(MockDataService);

  newIpAddress = '';
  newIpReason = '';

  submitIpBan() {
    if (this.newIpAddress && this.newIpReason) {
      this.data.addIpBlacklist(this.newIpAddress, this.newIpReason);
      this.newIpAddress = '';
      this.newIpReason = '';
    }
  }
}
