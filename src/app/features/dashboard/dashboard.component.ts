import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TroopService } from '../../core/services/troop.service';
import { AlertService } from '../../core/services/alert.service';
import { DataService } from '../../core/services/data.service';
import { TroopStats } from '../../core/models/troop.model';
import { Alert, WarSituation, Mission } from '../../core/models/alert.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stats: TroopStats = { active:0, injured:0, reserve:0, total:0, combatReadyPct:0 };
  alerts: Alert[] = [];
  situation: WarSituation | null = null;
  missions: Mission[] = [];
  sectorBreakdown: Record<string, TroopStats> = {};
  tickerMessage = '';
  private tickerIndex = 0;

  readonly INTEL_FEED = [
    'Northern coalition moving 3 battalions toward Grid 7-4',
    'Secure channel established with Forward Operating Base Kilo',
    'Supply convoy ETA 45 min to Sector Bravo checkpoint',
    'Drone recon confirms enemy armour staging at Grid 2-8',
    'Sector Delta patrol returned safely — route clear',
    'Signal intercept: enemy reinforcements expected 0300hrs',
    'Air recon completed over Sector Alpha — area assessed clear',
    '12 casualties evacuated — 3 critical, 9 stable condition',
  ];

  constructor(
    private troopService: TroopService,
    private alertService: AlertService,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    this.troopService.getStats().pipe(takeUntil(this.destroy$)).subscribe(s => this.stats = s);
    this.troopService.getSectorBreakdown().pipe(takeUntil(this.destroy$)).subscribe(b => this.sectorBreakdown = b);
    this.alertService.getAll().pipe(takeUntil(this.destroy$)).subscribe(a => this.alerts = a.slice(0, 8));
    this.dataService.getWarSituation().pipe(takeUntil(this.destroy$)).subscribe(s => this.situation = s);
    this.dataService.getMissions().pipe(takeUntil(this.destroy$)).subscribe(m => this.missions = m);
    this.rotateTicker();
    setInterval(() => this.rotateTicker(), 6000);
  }

  rotateTicker(): void {
    this.tickerMessage = this.INTEL_FEED[this.tickerIndex++ % this.INTEL_FEED.length];
  }

  get sectors() { return ['Alpha','Bravo','Charlie','Delta']; }
  alertColor = (l: string): string => ({ critical:'#f85149', warning:'#d29922', info:'#3fb950' } as any)[l] ?? '#8b949e';
  threatColor = (l: string): string => ({ low:'#3fb950', medium:'#d29922', high:'#f85149', critical:'#ff3c3c' } as any)[l] ?? '#8b949e';
  missionColor = (s: string): string => ({ active:'#58a6ff', completed:'#3fb950', pending:'#d29922', failed:'#f85149' } as any)[s] ?? '#8b949e';
  sectorColor = (n: string): string => ({ Alpha:'#3fb950', Bravo:'#f85149', Charlie:'#58a6ff', Delta:'#d29922' } as any)[n] ?? '#8b949e';
  timeAgo = (d: Date): string => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`;
  };

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
