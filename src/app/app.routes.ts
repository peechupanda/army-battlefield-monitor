import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — BFMS',
  },
  {
    path: 'map',
    loadComponent: () => import('./features/battlefield-map/battlefield-map.component').then(m => m.BattlefieldMapComponent),
    title: 'Tactical Map — BFMS',
  },
  {
    path: 'troops',
    loadComponent: () => import('./features/troop-database/troop-database.component').then(m => m.TroopDatabaseComponent),
    title: 'Troop Database — BFMS',
  },
  {
    path: 'command',
    loadComponent: () => import('./features/command-center/command-center.component').then(m => m.CommandCenterComponent),
    title: 'Command Center — BFMS',
  },
  {
    path: 'alerts',
    loadComponent: () => import('./features/alerts-panel/alerts-panel.component').then(m => m.AlertsPanelComponent),
    title: 'Alerts — BFMS',
  },
  { path: '**', redirectTo: 'dashboard' },
];
