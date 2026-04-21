import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-player-map',
  standalone: true,
  imports: [CommonModule, TooltipModule, DecimalPipe],
  template: `
    <div class="map-page-container">
      <div class="map-card">
        <div class="map-header">
          <div class="status-dot"></div>
          <span class="text-xs font-display font-bold uppercase tracking-wider">Live Player Intel</span>
          <span class="text-[10px] font-mono text-(--color-rust-text-muted) ml-2">
            {{ onlinePlayers().length }} Contacts Detected
          </span>
        </div>

        <div class="map-viewport">
          <div class="map-image-wrapper">
            <img src="cbimage.png" alt="Rust Legacy Map" class="map-image" #mapImg>
            
            @for (player of onlinePlayers(); track player.uid) {
              @let pos = getPosition(player.location);
              @if (!pos.outOfBounds) {
                <div class="player-marker" 
                     [style.left]="pos.left" 
                     [style.top]="pos.top"
                     [pTooltip]="playerTooltip"
                     tooltipPosition="top">
                  <div class="player-marker-pulse"></div>
                  
                  <ng-template #playerTooltip>
                    <div class="player-tooltip-content">
                      <div class="player-tooltip-name">{{ player.name }}</div>
                      <div class="player-tooltip-coords">
                        X: {{ player.location.x | number:'1.0-0' }} 
                        Y: {{ player.location.y | number:'1.0-0' }} 
                        Z: {{ player.location.z | number:'1.0-0' }}
                      </div>
                      <div class="text-[9px] text-(--color-rust-success-light) mt-1 font-bold">
                        CONNECTED
                      </div>
                    </div>
                  </ng-template>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 4rem);
      padding: 1.5rem;
      gap: 1.5rem;
      overflow: hidden;
    }

    .map-card {
      flex: 1;
      position: relative;
      background: var(--color-rust-surface);
      border: 1px solid var(--color-rust-border);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-glass);
    }

    .map-header {
      position: absolute;
      top: 1rem;
      left: 1rem;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--color-rust-elevated);
      backdrop-filter: blur(8px);
      border: 1px solid var(--color-rust-border);
      border-radius: var(--border-radius-sm);
    }

    .status-dot {
      width: 0.5rem;
      height: 0.5rem;
      background: var(--color-rust-success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--color-rust-success);
    }

    .map-viewport {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d0d0d;
    }

    .map-image-wrapper {
      position: relative;
      display: inline-block;
      max-width: 100%;
      max-height: 100%;
    }

    .map-image {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .player-marker {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #ff3b30;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 20;
      box-shadow: 0 0 8px #ff3b30, 0 0 15px rgba(255, 59, 48, 0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .player-marker:hover {
      width: 16px;
      height: 16px;
      z-index: 30;
      box-shadow: 0 0 15px #ff3b30, 0 0 25px rgba(255, 59, 48, 0.8);
    }

    .player-marker-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      background: rgba(255, 59, 48, 0.4);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: marker-pulse 2s infinite;
      pointer-events: none;
    }

    @keyframes marker-pulse {
      0% { width: 100%; height: 100%; opacity: 0.8; }
      100% { width: 300%; height: 300%; opacity: 0; }
    }

    .player-tooltip-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .player-tooltip-name { font-weight: bold; color: var(--color-rust-text-primary); }
    .player-tooltip-coords { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-rust-text-muted); }
  `]
})
export class PlayerMapComponent {
  private eventService = inject(EventService);
  public onlinePlayers = this.eventService.onlinePlayers;

  public getPosition(location: { x: number, y: number, z: number }) {
    const minX = 4000;
    const maxX = 7500;
    const minZ = -6150;
    const maxZ = -1500;

    const top = ((location.x - minX) / (maxX - minX)) * 100;
    const left = ((location.z - minZ) / (maxZ - minZ)) * 100;

    const outOfBounds = 
      location.x < minX || location.x > maxX || 
      location.z < minZ || location.z > maxZ;

    return { top: `${top}%`, left: `${left}%`, outOfBounds };
  }
}
