import { Component, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventService } from '../../core/services/event.service';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, InputTextModule],
  template: `
    <div class="h-[calc(100vh-6rem)] w-full animate-rust-fade-in flex flex-col lg:flex-row gap-6">
      
      <!-- ============================================== -->
      <!-- LEFT PANEL: CHAT FEED -->
      <!-- ============================================== -->
      <div class="rust-panel flex flex-col flex-1 h-full min-h-0 relative">
        
        <!-- Header -->
        <div class="shrink-0 flex flex-wrap items-center justify-between px-5 py-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)]">
          <div class="flex items-center gap-3">
            <i class="pi pi-comments text-[var(--color-rust-500)]"></i>
            <h2 class="font-display font-bold uppercase tracking-wider text-sm text-[var(--color-rust-text-primary)]">Server Chat</h2>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1 text-xs font-mono rounded-sm transition-colors border"
                    [class]="chatFilter() === 'all' ? 'bg-[var(--color-rust-500)] text-white border-[var(--color-rust-500)]' : 'bg-transparent text-[var(--color-rust-text-secondary)] border-[var(--color-rust-border)] hover:bg-[var(--color-rust-overlay)]'"
                    (click)="chatFilter.set('all')">All</button>
                    
            <button class="px-3 py-1 text-xs font-mono rounded-sm transition-colors border"
                    [class]="chatFilter() === 'admins' ? 'bg-[var(--color-rust-500)] text-white border-[var(--color-rust-500)]' : 'bg-transparent text-[var(--color-rust-text-secondary)] border-[var(--color-rust-border)] hover:bg-[var(--color-rust-overlay)]'"
                    (click)="chatFilter.set('admins')">Admins</button>
          </div>
        </div>

        <!-- Chat Feed -->
        <div #chatContainer class="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[var(--color-rust-surface)]">
          @for (msg of filteredChat(); track msg.id) {
            <div class="text-sm">
              <span class="text-[10px] font-mono text-[var(--color-rust-text-muted)] mr-2">[{{ msg.timestamp | date:'HH:mm:ss' }}]</span>
              
              <span class="font-bold relative select-all"
                    [class]="msg.isAdmin ? 'text-[var(--color-rust-500)]' : 'text-[#a3e635]'">
                @if (msg.isAdmin) {
                  <i class="pi pi-shield text-[10px] mr-1"></i>
                }
                {{ msg.playerName }}:
              </span>
              
              <span class="ml-2 text-[var(--color-rust-text-primary)] leading-relaxed select-text">{{ msg.message }}</span>
            </div>
          } @empty {
            <div class="m-auto text-center text-[var(--color-rust-text-muted)] italic text-sm">
              No chat messages found.
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="shrink-0 p-4 border-t border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)]">
          <form class="flex items-center gap-3" (ngSubmit)="onSendChat()">
            <span class="text-xs font-display font-bold uppercase text-[var(--color-rust-500)] w-16 text-right">ADMIN</span>
            <input pInputText type="text" placeholder="Type a broadcast message..."
                   [(ngModel)]="chatInput" name="chatInput" autocomplete="off"
                   class="flex-1 bg-[var(--color-rust-surface)] border-[var(--color-rust-border)] focus:border-[var(--color-rust-500)]" />
            <p-button type="submit" icon="pi pi-send" [disabled]="!chatInput.trim()"></p-button>
          </form>
        </div>
      </div>


      <!-- ============================================== -->
      <!-- RIGHT PANEL: RCON CONSOLE -->
      <!-- ============================================== -->
      <div class="flex flex-col flex-1 h-full min-h-0 rounded-sm shadow-xl"
           style="background-color: var(--color-rust-base); border: 2px solid var(--color-rust-border-accent);">
        
        <!-- Console Header -->
        <div class="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--color-rust-border-accent)] bg-black/40">
          <div class="flex items-center gap-2">
            <i class="pi pi-server text-[#8b5e3c] text-xs"></i>
            <span class="font-mono font-bold text-xs text-[#8b5e3c] uppercase tracking-widest">RCON Terminal</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-[var(--color-rust-success)] animate-rust-pulse"></div>
            <span class="text-[10px] font-mono text-[var(--color-rust-text-muted)]">CONNECTED</span>
          </div>
        </div>

        <!-- Console Output -->
        <!-- Estilo hacker clássico com scroll nativo e texto que quebra e mantem a formatação -->
        <div #consoleContainer class="flex-1 overflow-y-auto p-4 bg-[#0a0f0a] font-mono text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-[#4d7c0f] selection:text-white">
          @for (entry of data.consoleHistory(); track entry.id) {
            <div class="mb-1"
                 [class.text-[#fcd34d]]="entry.type === 'output'"
                 [class.text-[#d1d5db]]="entry.type === 'input'"
                 [class.text-[#ef4444]]="entry.type === 'error'"
                 [class.text-[#f59e0b]]="entry.type === 'warning'">
                 
              @if (entry.type === 'input') {
                <span class="text-[#4ade80] opacity-70 mr-2">></span>
              }
              <span>{{ entry.message }}</span>
            </div>
          }
        </div>

        <!-- Console Input -->
        <div class="shrink-0 flex items-center bg-[#0a0f0a] p-3 border-t border-[var(--color-rust-border)]">
          <span class="text-[#4ade80] font-mono text-sm mr-3 font-bold">></span>
          <form class="flex-1 flex" (ngSubmit)="onSendConsole()">
            <!-- Native input para não ter estilos do p-inputtext quebrando o look do console -->
            <input type="text"
                   class="flex-1 bg-transparent border-0 outline-none font-mono text-sm text-[#d1d5db] placeholder-[#4b5563]"
                   placeholder="Enter server command..."
                   [(ngModel)]="consoleInput" name="consoleInput"
                   autocomplete="off" spellcheck="false"
                   (keydown)="onConsoleKeyDown($event)" />
          </form>
        </div>

      </div>

    </div>
  `
})
export class ChatPage implements AfterViewChecked {
  data = inject(MockDataService);
  private eventService = inject(EventService);
  private adminApi = inject(AdminApiService);

  // Chat State
  chatFilter = signal<'all' | 'admins'>('all');
  chatInput = '';
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  private shouldScrollChat = false;
  
  filteredChat = computed(() => {
    const list = this.eventService.chatMessages();
    this.shouldScrollChat = true; 
    if (this.chatFilter() === 'admins') return list.filter(m => m.isAdmin);
    return list;
  });

  // Console State
  consoleInput = '';
  commandHistory: string[] = []; // Local history of inputs
  historyIndex = -1;
  @ViewChild('consoleContainer') consoleContainer!: ElementRef;
  private shouldScrollConsole = false;

  readonly consoleHistory = this.eventService.consoleHistory;

  constructor() {
    effect(() => {
      this.eventService.chatMessages();
      this.shouldScrollChat = true;
    });

    effect(() => {
      this.eventService.consoleHistory();
      this.shouldScrollConsole = true;
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // ============== Actions ==============

  onSendChat() {
    if (!this.chatInput.trim()) return;
    this.adminApi.broadcast(this.chatInput).subscribe(() => {
      this.chatInput = '';
    });
  }

  onSendConsole() {
    if (!this.consoleInput.trim()) return;
    
    const cmd = this.consoleInput.trim();
    this.adminApi.sendCommand(cmd).subscribe(() => {
      // Add to history if it's different from the last one or history is empty
      if (this.commandHistory[this.commandHistory.length - 1] !== cmd) {
        this.commandHistory.push(cmd);
      }
      this.historyIndex = this.commandHistory.length;
      this.consoleInput = '';
    });
  }

  onConsoleKeyDown(event: KeyboardEvent) {
    if (this.commandHistory.length === 0) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.consoleInput = this.commandHistory[this.historyIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.consoleInput = this.commandHistory[this.historyIndex];
      } else {
        this.historyIndex = this.commandHistory.length;
        this.consoleInput = '';
      }
    }
  }

  // ============== Utils ==============

  private scrollToBottom(): void {
    if (this.shouldScrollChat && this.chatContainer) {
      try {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
        this.shouldScrollChat = false;
      } catch(err) { }
    }

    if (this.shouldScrollConsole && this.consoleContainer) {
      try {
        const el = this.consoleContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
        this.shouldScrollConsole = false;
      } catch(err) { }
    }
  }
}
