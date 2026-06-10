import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertService } from './core/services/alert.service';
import { WebSocketService } from './core/services/websocket.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  alertCount$!: Observable<number>;
  sidebarCollapsed = false;
  currentTime = new Date();

  nav = [
    { path: '/dashboard', icon: '⬡', label: 'DASHBOARD'  },
    { path: '/map',       icon: '⬡', label: 'TACTICAL MAP' },
    { path: '/troops',    icon: '⬡', label: 'TROOPS DB'  },
    { path: '/command',   icon: '⬡', label: 'COMMAND'    },
    { path: '/alerts',    icon: '⬡', label: 'ALERTS'     },
  ];

  constructor(
    private alertService: AlertService,
    private wsService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.alertCount$ = this.alertService.getCount();
    setInterval(() => (this.currentTime = new Date()), 1000);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
