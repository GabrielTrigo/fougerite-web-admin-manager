import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface FougeritePlugin {
  name: string;
  author: string;
  version: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, ToggleSwitchModule, ToastModule],
  providers: [MessageService],
  template: `
    <!-- PrimeNG Toaster anchor -->
    <p-toast></p-toast>

    <div class="animate-rust-fade-in flex flex-col h-[calc(100vh-6rem)] relative">
      
      <!-- Top Title -->
      <div class="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h2 class="text-xl font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)]">
            Server Configurations
          </h2>
          <p class="text-sm text-[var(--color-rust-text-muted)] mt-1">
            Manage global engine parameters, RCON connections, and active plugins.
          </p>
        </div>

        <p-button 
          label="SAVE SETTINGS" 
          icon="pi pi-save" 
          [loading]="isSaving"
          (onClick)="saveSettings()">
        </p-button>
      </div>

      <!-- Scrolled Content (Grid) -->
      <div class="overflow-y-auto flex-1 pb-10 flex flex-col gap-6">
        
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          <!-- Column 1: Core Params & RCON -->
          <div class="flex flex-col gap-6">
            
            <!-- Server Engine Settings -->
            <div class="rust-panel overflow-hidden">
              <div class="p-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)]">
                <h3 class="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-rust-text-primary)] flex items-center gap-2">
                  <i class="pi pi-server text-[var(--color-rust-500)]"></i> Global Parameters
                </h3>
              </div>
              <div class="p-5 flex flex-col gap-5">
                <!-- Hostname -->
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-mono text-[var(--color-rust-text-muted)] uppercase tracking-widest">Hostname (server.hostname)</label>
                  <input type="text" pInputText [(ngModel)]="cfg.hostname" class="font-semibold text-white">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <!-- Max Players -->
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-mono text-[var(--color-rust-text-muted)] uppercase tracking-widest">Max Players (server.maxplayers)</label>
                    <input type="number" pInputText [(ngModel)]="cfg.maxPlayers">
                  </div>
                  <!-- Port -->
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-mono text-[var(--color-rust-text-muted)] uppercase tracking-widest">Port (server.port)</label>
                    <input type="number" pInputText [(ngModel)]="cfg.port">
                  </div>
                </div>

                <!-- PVP & Sleepers -->
                <div class="grid grid-cols-2 gap-4 pt-2">
                  <div class="flex items-center gap-3">
                    <p-toggleSwitch [(ngModel)]="cfg.pvp"></p-toggleSwitch>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold uppercase tracking-widest">PVP Allowed</span>
                      <span class="text-[9px] text-[var(--color-rust-text-muted)] uppercase">server.pvp</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <p-toggleSwitch [(ngModel)]="cfg.sleepers"></p-toggleSwitch>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold uppercase tracking-widest">Sleepers</span>
                      <span class="text-[9px] text-[var(--color-rust-text-muted)] uppercase">sleepers.on</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RCON & Data Gateway -->
            <div class="rust-panel overflow-hidden border-l-4 border-l-[var(--color-rust-danger)]">
              <div class="p-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-danger)]/5">
                <h3 class="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-rust-danger-light)] flex items-center gap-2">
                  <i class="pi pi-key"></i> Gateway & RCON Credentials
                </h3>
              </div>
              <div class="p-5 grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label class="text-[10px] font-mono text-[var(--color-rust-danger-light)] uppercase tracking-widest">RCON Password</label>
                  <input type="password" pInputText [(ngModel)]="rcon.password" placeholder="•••••••••" class="border-[var(--color-rust-danger)]/30 focus:border-[var(--color-rust-danger)]">
                </div>
                <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label class="text-[10px] font-mono text-[var(--color-rust-danger-light)] uppercase tracking-widest">Database URI</label>
                  <input type="text" pInputText [(ngModel)]="rcon.dbHost" class="border-[var(--color-rust-danger)]/30 focus:border-[var(--color-rust-danger)]">
                </div>
                <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label class="text-[10px] font-mono text-[var(--color-rust-text-muted)] uppercase tracking-widest">DB Username</label>
                  <input type="text" pInputText [(ngModel)]="rcon.dbUser">
                </div>
                <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label class="text-[10px] font-mono text-[var(--color-rust-text-muted)] uppercase tracking-widest">DB Password</label>
                  <input type="password" pInputText [(ngModel)]="rcon.dbPass" placeholder="•••••••••">
                </div>
              </div>
            </div>

          </div>

          <!-- Column 2: Plugin Management Ecosystem -->
          <div class="rust-panel flex flex-col overflow-hidden">
            <div class="p-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)] flex justify-between items-center">
              <h3 class="font-display font-bold text-sm uppercase tracking-widest text-[var(--color-rust-text-primary)] flex items-center gap-2">
                <i class="pi pi-box text-[#a3e635]"></i> Fougerite Plugins
              </h3>
              <span class="text-xs text-[var(--color-rust-text-muted)] font-mono">{{ activePluginCount }} Active</span>
            </div>
            
            <div class="flex-1 p-2">
              <div class="flex flex-col gap-2">
                @for (plugin of plugins; track plugin.name) {
                  <div class="p-3 border border-[var(--color-rust-border)] rounded-sm hover:bg-[var(--color-rust-overlay)] transition-colors duration-150"
                       [class.bg-[var(--color-rust-elevated)]]="!plugin.enabled"
                       [class.opacity-50]="!plugin.enabled">
                    <div class="flex items-start justify-between gap-4">
                      
                      <div class="flex items-start gap-3">
                        <i class="pi" [ngClass]="plugin.enabled ? 'pi-check-circle text-[#a3e635]' : 'pi-minus-circle text-[var(--color-rust-text-muted)]'" style="font-size: 1.25rem;"></i>
                        <div class="flex flex-col">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-sm text-[var(--color-rust-text-primary)]">{{ plugin.name }}</span>
                            <span class="text-[10px] font-mono bg-black/40 px-1 py-0.5 rounded text-[var(--color-rust-text-muted)]">v{{ plugin.version }}</span>
                          </div>
                          <span class="text-[10px] font-mono text-[var(--color-rust-text-secondary)] mt-0.5">Author: {{ plugin.author }}</span>
                          <p class="text-xs text-[var(--color-rust-text-muted)] mt-1 max-w-sm">{{ plugin.description }}</p>
                        </div>
                      </div>

                      <p-toggleSwitch [(ngModel)]="plugin.enabled"></p-toggleSwitch>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="p-3 border-t border-[var(--color-rust-border)] bg-[var(--color-rust-surface)] text-center">
               <p class="text-[10px] font-mono text-[var(--color-rust-text-muted)]">
                 Any modified plugin state requires a soft Server Restart to compile the C# assemblies.
               </p>
            </div>
          </div>

        </div>
      </div>
    
    </div>
  `
})
export class SettingsPage {
  
  // Fake local loading state
  isSaving = false;

  // Configuration forms
  cfg = {
    hostname: 'Rust Legacy — Fougerite #1',
    maxPlayers: 100,
    port: 28015,
    pvp: true,
    sleepers: true
  };

  rcon = {
    password: 'super_secret_rcon',
    dbHost: 'localhost:3306',
    dbUser: 'rust_admin',
    dbPass: ''
  };

  // Mocked localized ecosystem
  plugins: FougeritePlugin[] = [
    { name: 'RustProtect', author: 'FougeriteTeam', version: '1.2.0', description: 'Powerful anti-tamper and client hashing to prevent JIT modification.', enabled: true },
    { name: 'Oxmin', author: 'Pluton', version: '2.1.4', description: 'Core translation and admin privilege management (Flags matrix).', enabled: true },
    { name: 'Economy', author: 'DreTaX', version: '1.0.5', description: 'Introduces physical money mechanics, /money and Vault systems.', enabled: true },
    { name: 'Kits', author: 'Salva', version: '3.0', description: 'Permits spawning VIP, Starter, and event kits via chat commands.', enabled: false },
    { name: 'BountyHunter', author: 'Ra1n', version: '1.1', description: 'Setup bounties on notorious players. Rewards on confirmed kills.', enabled: false },
    { name: 'InstaCraft', author: 'Unknown', version: '0.9', description: 'Removes the timer progression on any crafting item universally.', enabled: true }
  ];

  constructor(private messageService: MessageService) {}

  get activePluginCount() {
    return this.plugins.filter(p => p.enabled).length;
  }

  saveSettings() {
    this.isSaving = true;
    
    // Simulate API write delay
    setTimeout(() => {
      this.isSaving = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Configuration Saved',
        detail: 'CFG arguments and Plugin states were safely injected into the server core.'
      });
    }, 800);
  }
}
