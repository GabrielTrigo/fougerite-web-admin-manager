import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
        title: 'Dashboard — FWAM',
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./pages/map/player-map.component').then(m => m.PlayerMapComponent),
        title: 'Live Map — FWAM',
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./pages/players/players').then(m => m.PlayersPage),
        title: 'Players — FWAM',
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/chat/chat').then(m => m.ChatPage),
        title: 'Chat & Console — FWAM',
      },
      {
        path: 'bans',
        loadComponent: () =>
          import('./pages/bans/bans').then(m => m.BansPage),
        title: 'Ban Management — FWAM',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/analytics').then(m => m.AnalyticsPage),
        title: 'Analytics — FWAM',
      },
      {
        path: 'automation',
        loadComponent: () =>
          import('./pages/automation/automation').then(m => m.AutomationPage),
        title: 'Automation — FWAM',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./pages/security/security').then(m => m.SecurityPage),
        title: 'Security — FWAM',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(m => m.SettingsPage),
        title: 'Settings — FWAM',
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
