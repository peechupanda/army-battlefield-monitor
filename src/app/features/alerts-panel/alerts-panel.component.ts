import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertService } from '../../core/services/alert.service';
import { Alert, AlertLevel } from '../../core/models/alert.model';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="alerts-page">
  <div class="al-header">
    <div class="al-title">⚠ ALERTS &amp; INTEL</div>
    <div class="al-counts">
      <span class="ac critical">🔴 Critical: {{ countOf('critical') }}</span>
      <span class="ac warning">🟡 Warning: {{ countOf('warning') }}</span>
      <span class="ac info">🟢 Info: {{ countOf('info') }}</span>
    </div>
  </div>

  <div class="al-filters">
    <button class="fil-btn" [class.active]="filter === 'all'"      (click)="setFilter('all')">All ({{ alerts.length }})</button>
    <button class="fil-btn critical" [class.active]="filter === 'critical'" (click)="setFilter('critical')">Critical</button>
    <button class="fil-btn warning"  [class.active]="filter === 'warning'"  (click)="setFilter('warning')">Warning</button>
    <button class="fil-btn info"     [class.active]="filter === 'info'"     (click)="setFilter('info')">Info</button>
    <button class="fil-btn ack"      [class.active]="filter === 'ack'"      (click)="setFilter('ack')">Acknowledged</button>
  </div>

  <div class="al-list">
    <div class="al-item" *ngFor="let a of filtered" [class.acked]="a.acknowledged"
         [style.border-left-color]="levelColor(a.level)">
      <div class="al-item-header">
        <span class="al-level" [style.color]="levelColor(a.level)">{{ a.level | uppercase }}</span>
        <span class="al-sector" *ngIf="a.sector" [style.color]="sectorColor(a.sector)">SEC-{{ a.sector | uppercase }}</span>
        <span class="al-time">{{ timeAgo(a.timestamp) }}</span>
        <button class="ack-btn" *ngIf="!a.acknowledged" (click)="acknowledge(a.id)">✓ ACK</button>
      </div>
      <div class="al-msg">{{ a.message }}</div>
      <div class="al-source" *ngIf="a.source">Source: {{ a.source }}</div>
    </div>
    <div class="al-empty" *ngIf="filtered.length === 0">● All clear — No alerts in this category</div>
  </div>
</div>
  `,
  styleUrls: ['./alerts-panel.component.scss'],
})
export class AlertsPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  alerts: Alert[] = [];
  filter: 'all'|AlertLevel|'ack' = 'all';

  get filtered(): Alert[] {
    if (this.filter === 'ack')  return this.alerts.filter(a => a.acknowledged);
    if (this.filter === 'all')  return this.alerts;
    return this.alerts.filter(a => a.level === this.filter && !a.acknowledged);
  }

  countOf(level: AlertLevel): number {
    return this.alerts.filter(a => a.level === level && !a.acknowledged).length;
  }

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.getAll().pipe(takeUntil(this.destroy$)).subscribe(a => this.alerts = a);
  }

  setFilter(f: typeof this.filter): void { this.filter = f; }

  acknowledge(id: string): void {
    this.alertService.acknowledge(id).subscribe();
  }

  levelColor  = (l: string): string => ({ critical:'#f85149', warning:'#d29922', info:'#3fb950' } as any)[l] ?? '#8b949e';
  sectorColor = (s: string): string => ({ Alpha:'#3fb950', Bravo:'#f85149', Charlie:'#58a6ff', Delta:'#d29922' } as any)[s] ?? '#8b949e';
  timeAgo = (d: Date): string => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`;
  };

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
