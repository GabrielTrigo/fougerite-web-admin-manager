import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule  } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TableModule, TagModule, ToggleSwitchModule , ButtonModule],
  template: `
    <div class="animate-rust-fade-in flex flex-col h-[calc(100vh-6rem)]">
      
      <!-- Header -->
      <div class="mb-6 shrink-0">
        <h2 class="text-xl font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)]">
          Automation & Scheduling
        </h2>
        <p class="text-sm text-[var(--color-rust-text-muted)] mt-1">
          Configure server-side cron jobs like wipes, airdrops, and automatic messages.
        </p>
      </div>

      <!-- Scrollable content -->
      <div class="overflow-y-auto flex-1 pb-8 flex flex-col gap-6">
        
        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Restart Card -->
          <div class="rust-panel p-5 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <i class="pi pi-power-off" style="font-size: 8rem;"></i>
            </div>
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2 text-[var(--color-rust-500)]">
                <i class="pi pi-sync"></i>
                <h3 class="font-display font-bold uppercase text-sm">Server Restart</h3>
              </div>
              <p-toggleSwitch [(ngModel)]="restartEnabled" (onChange)="toggleLocalJob('j1', restartEnabled)"></p-toggleSwitch>
            </div>
            <p class="text-xs text-[var(--color-rust-text-muted)] mb-4">Schedules a graceful server stop and start loop to flush engine cache.</p>
            <div class="flex items-center justify-between border-t border-[var(--color-rust-border)] pt-3">
              <div class="text-[10px] font-mono text-[var(--color-rust-text-secondary)]">RUNS AT</div>
              <div class="text-sm font-mono font-bold text-[var(--color-rust-text-primary)]">06:00 AM</div>
            </div>
          </div>

          <!-- Airdrop Card -->
          <div class="rust-panel p-5 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <i class="pi pi-gift" style="font-size: 8rem;"></i>
            </div>
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2 text-[var(--color-rust-500)]">
                <i class="pi pi-box"></i>
                <h3 class="font-display font-bold uppercase text-sm">Hourly Airdrop</h3>
              </div>
              <p-toggleSwitch [(ngModel)]="airdropEnabled" (onChange)="toggleLocalJob('j2', airdropEnabled)"></p-toggleSwitch>
            </div>
            <p class="text-xs text-[var(--color-rust-text-muted)] mb-4">Automatically requests the cargo plane to drop supply crates at random roads.</p>
            <div class="flex items-center justify-between border-t border-[var(--color-rust-border)] pt-3">
              <div class="text-[10px] font-mono text-[var(--color-rust-text-secondary)]">INTERVAL</div>
              <div class="text-sm font-mono font-bold text-[var(--color-rust-text-primary)]">Every 60 min</div>
            </div>
          </div>

          <!-- Broadcast Card -->
          <div class="rust-panel p-5 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <i class="pi pi-megaphone" style="font-size: 8rem;"></i>
            </div>
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2 text-[var(--color-rust-500)]">
                <i class="pi pi-comment"></i>
                <h3 class="font-display font-bold uppercase text-sm">Announcements</h3>
              </div>
              <p-toggleSwitch [(ngModel)]="broadcastEnabled" (onChange)="toggleLocalJob('j3', broadcastEnabled)"></p-toggleSwitch>
            </div>
            <p class="text-xs text-[var(--color-rust-text-muted)] mb-4">Rotates global server rules and Discord link in the chat for new players.</p>
            <div class="flex items-center justify-between border-t border-[var(--color-rust-border)] pt-3">
              <div class="text-[10px] font-mono text-[var(--color-rust-text-secondary)]">MESSAGES RUNNING</div>
              <div class="text-sm font-mono font-bold text-[#a3e635]">3 active</div>
            </div>
          </div>

          <!-- Wipe Card -->
          <div class="rust-panel p-5 relative overflow-hidden group border-2 border-[var(--color-rust-danger)] bg-red-900/10">
            <div class="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-20 transition-opacity text-[var(--color-rust-danger)]">
              <i class="pi pi-trash" style="font-size: 8rem;"></i>
            </div>
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2 text-[var(--color-rust-danger)]">
                <i class="pi pi-exclamation-triangle"></i>
                <h3 class="font-display font-bold uppercase text-sm text-[var(--color-rust-danger)] drop-shadow-md">Server Format</h3>
              </div>
              <p-toggleSwitch [(ngModel)]="wipeEnabled" (onChange)="toggleLocalJob('j4', wipeEnabled)"></p-toggleSwitch>
            </div>
            <p class="text-xs text-[var(--color-rust-danger-light)] mb-4">Destructive action! Wipes entity saves and player inventories automatically.</p>
            <div class="flex items-center justify-between border-t border-[var(--color-rust-border)] pt-3">
              <div class="text-[10px] font-mono text-[var(--color-rust-danger-light)]">SCHEDULED WIPE</div>
              <div class="text-sm font-mono font-bold text-[var(--color-rust-text-primary)]">Every Thursday</div>
            </div>
          </div>

        </div>

        <!-- Automation Table -->
        <div class="rust-panel flex flex-col flex-1 min-h-[300px]">
          <div class="p-4 border-b border-[var(--color-rust-border)]">
            <h3 class="font-display font-bold text-sm tracking-wider uppercase">Active Cron Jobs</h3>
          </div>
          
          <p-table [value]="data.automationJobs()" responsiveLayout="scroll" styleClass="w-full">
            <ng-template #header>
              <tr>
                <th style="width: 250px">Job Detail</th>
                <th style="width: 150px">Cron Syntax</th>
                <th style="width: 150px">Last Run</th>
                <th style="width: 150px">Next Scheduled</th>
                <th style="width: 100px" class="text-center">Active</th>
              </tr>
            </ng-template>

            <ng-template #body let-job>
              <tr [class.opacity-60]="!job.isEnabled">
                <td>
                  <div class="font-bold text-[var(--color-rust-text-primary)]">{{ job.name }}</div>
                  <div class="text-[10px] text-[var(--color-rust-text-muted)] truncate max-w-xs">{{ job.description }}</div>
                </td>
                <td>
                  <div class="bg-black/30 px-2 py-1 rounded-sm text-[#a3e635] text-xs font-mono inline-block border border-[#a3e635]/20">
                    {{ job.cronExpression }}
                  </div>
                </td>
                <td class="text-sm text-[var(--color-rust-text-secondary)] font-mono">
                  @if (job.lastRunAt) {
                    {{ job.lastRunAt | date:'dd MMM, HH:mm' }}
                  } @else {
                    <span class="text-[var(--color-rust-text-muted)]">N/A</span>
                  }
                </td>
                <td>
                  <div class="text-sm font-semibold" [class]="job.isEnabled ? 'text-[var(--color-rust-500)]' : 'text-[var(--color-rust-text-muted)]'">
                    {{ job.nextRunAt | date:'dd MMM, HH:mm' }}
                  </div>
                </td>
                <td class="text-center">
                  <p-toggleSwitch [ngModel]="job.isEnabled" (ngModelChange)="data.toggleAutomationJob(job.id, $event); syncLocals()"></p-toggleSwitch>
                </td>
              </tr>
            </ng-template>
            
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center p-6 text-[var(--color-rust-text-muted)] italic">No scheduled jobs found.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      </div>
    </div>
  `
})
export class AutomationPage {
  data = inject(MockDataService);

  // Local state for UI cards (keeps them in sync with backend data)
  restartEnabled = false;
  airdropEnabled = false;
  broadcastEnabled = false;
  wipeEnabled = false;

  constructor() {
    this.syncLocals();
  }

  // Sincroniza o estado da tabela global (Signals) para atualizar visualmente as chaves nos cards grandes.
  syncLocals() {
    const jobs = this.data.automationJobs();
    
    const j1 = jobs.find(j => j.id === 'j1');
    if (j1) this.restartEnabled = j1.isEnabled;
    
    const j2 = jobs.find(j => j.id === 'j2');
    if (j2) this.airdropEnabled = j2.isEnabled;

    const j3 = jobs.find(j => j.id === 'j3');
    if (j3) this.broadcastEnabled = j3.isEnabled;

    const j4 = jobs.find(j => j.id === 'j4');
    if (j4) this.wipeEnabled = j4.isEnabled;
  }

  // Evento dos cards para atualizar o server global
  toggleLocalJob(jobId: string, state: boolean) {
    this.data.toggleAutomationJob(jobId, state);
  }
}
