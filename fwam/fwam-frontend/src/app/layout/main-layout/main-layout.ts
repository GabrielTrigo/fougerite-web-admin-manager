import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Topbar, DrawerModule],
  template: `
    <div class="flex h-screen overflow-hidden relative" style="background: var(--color-rust-base)">
      
      <!-- Desktop Sidebar (Hidden on Mobile <1024px) -->
      <div class="hidden lg:flex h-full">
        <app-sidebar />
      </div>

      <!-- Mobile Drawer Sidebar (Sliding Off-Canvas) -->
      <p-drawer [(visible)]="isMobileSidebarOpen" position="left" styleClass="w-60 !p-0 !border-0 text-white shadow-2xl">
        <ng-template #headless>
           <app-sidebar (navigateOut)="isMobileSidebarOpen = false" />
        </ng-template>
      </p-drawer>

      <!-- Main content -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden relative border-l border-[var(--color-rust-border)]">
        <app-topbar (toggleSidebar)="isMobileSidebarOpen = true" />

        <!-- Router Container with Native Fade-In applied on Components -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .p-drawer-content {
       background-color: var(--color-rust-surface) !important;
       padding: 0 !important;
    }
  `]
})
export class MainLayout {
  isMobileSidebarOpen = false;
}
