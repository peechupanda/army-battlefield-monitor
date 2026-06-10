import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TroopService } from '../../core/services/troop.service';
import { Troop, TroopStats, SectorName } from '../../core/models/troop.model';

type SortKey = keyof Troop;

@Component({
  selector: 'app-troop-database',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './troop-database.component.html',
  styleUrls: ['./troop-database.component.scss'],
})
export class TroopDatabaseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private allTroops: Troop[] = [];

  troops: Troop[] = [];
  stats: TroopStats = { active:0, injured:0, reserve:0, total:0, combatReadyPct:0 };

  filterStatus: 'all' | Troop['status'] = 'all';
  filterSector: 'all' | SectorName = 'all';
  searchQuery = '';
  sortKey: SortKey = 'id';
  sortDir: 1|-1 = 1;

  readonly sectors: SectorName[] = ['Alpha','Bravo','Charlie','Delta'];

  constructor(private troopService: TroopService) {}

  ngOnInit(): void {
    this.troopService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(troops => {
        this.allTroops = troops;
        this.applyFilters();
      });
    this.troopService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(s => this.stats = s);
  }

  applyFilters(): void {
    let data = [...this.allTroops];
    if (this.filterStatus !== 'all')   data = data.filter(t => t.status === this.filterStatus);
    if (this.filterSector !== 'all')   data = data.filter(t => t.sector === this.filterSector);
    if (this.searchQuery.trim())       data = data.filter(t =>
      t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      t.unit.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    data.sort((a, b) => {
      const av = (a as any)[this.sortKey] ?? '';
      const bv = (b as any)[this.sortKey] ?? '';
      if (av instanceof Date) return (av.getTime() - (bv as Date).getTime()) * this.sortDir;
      if (typeof av === 'number') return (av - bv) * this.sortDir;
      return String(av).localeCompare(String(bv)) * this.sortDir;
    });
    this.troops = data;
  }

  sortBy(key: SortKey): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 1 ? -1 : 1;
    else { this.sortKey = key; this.sortDir = 1; }
    this.applyFilters();
  }

  statusColor = (s: string): string => ({ active:'#3fb950', injured:'#f85149', reserve:'#a16207' } as any)[s] ?? '#8b949e';
  sectorColor  = (s: string): string => ({ Alpha:'#3fb950', Bravo:'#f85149', Charlie:'#58a6ff', Delta:'#d29922' } as any)[s] ?? '#8b949e';
  statusLabel  = (s: string): string => ({ active:'● ACTIVE', injured:'✦ INJURED', reserve:'■ RESERVE' } as any)[s] ?? s;
  timeAgo = (d: Date): string => {
    const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    return sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.floor(sec/60)}m` : `${Math.floor(sec/3600)}h`;
  };

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
