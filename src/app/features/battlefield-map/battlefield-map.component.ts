import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MapService } from '../../core/services/map.service';
import { DataService } from '../../core/services/data.service';
import { TroopService } from '../../core/services/troop.service';
import { AlertService } from '../../core/services/alert.service';
import { CommandService } from '../../core/services/command.service';
import { SectorName, TroopStats } from '../../core/models/troop.model';
import { TroopType } from '../../core/models/command.model';

@Component({
  selector: 'app-battlefield-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battlefield-map.component.html',
  styleUrls: ['./battlefield-map.component.scss'],
})
export class BattlefieldMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  is3D = false;
  selectedSector: SectorName | null = null;
  sectorStats: Record<string, TroopStats> = {};
  hoveredGrid = '';
  commandSector: SectorName = 'Alpha';
  commandType: TroopType = 'Infantry';
  commandCount = 25;
  commandLog = '';
  alertCount = 0;

  readonly troopTypes: TroopType[] = ['Infantry','Armoured','Artillery','Engineers','Medical'];
  readonly sectors: SectorName[] = ['Alpha','Bravo','Charlie','Delta'];
  sectorColor = (n: string): string => ({ Alpha:'#3fb950', Bravo:'#f85149', Charlie:'#58a6ff', Delta:'#d29922' } as any)[n] ?? '#8b949e';

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private troopService: TroopService,
    private alertService: AlertService,
    private commandService: CommandService,
  ) {}

  ngOnInit(): void {
    this.troopService.getSectorBreakdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => this.sectorStats = b);

    this.alertService.getCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => this.alertCount = c);
  }

  ngAfterViewInit(): void {
    this.mapService.init('tactical-map');

    this.mapService.onSectorClick = (sector) => {
      this.selectedSector = this.selectedSector === sector ? null : sector;
      this.commandSector = sector;
    };

    // Feed live data into the map
    this.dataService.getTroops()
      .pipe(takeUntil(this.destroy$))
      .subscribe(troops => this.mapService.updateTroops(troops));

    this.dataService.getEnemies()
      .pipe(takeUntil(this.destroy$))
      .subscribe(enemies => this.mapService.updateEnemies(enemies));

    this.mapService.invalidate();
  }

  toggle3D(): void {
    this.is3D = !this.is3D;
    this.mapService.toggle3D(this.is3D);
  }

  selectSector(sector: SectorName): void {
    this.selectedSector = this.selectedSector === sector ? null : sector;
    this.commandSector = sector;
    this.mapService.selectSector(this.selectedSector);
  }

  issueCommand(type: 'DEPLOY'|'EXTRACT'|'MEDEVAC'|'REINFORCE'|'AIRSTRIKE'): void {
    this.commandService.issue({
      type,
      sector: this.commandSector,
      troopType: this.commandType,
      count: this.commandCount,
    }).subscribe(cmd => {
      const colorMap: Record<string, string> = {
        DEPLOY:'#3fb950', EXTRACT:'#58a6ff', MEDEVAC:'#f85149', REINFORCE:'#a371f7', AIRSTRIKE:'#ff9a3c'
      };
      this.commandLog = `[${new Date().toTimeString().slice(0,8)}] ${type} → ${this.commandSector.toUpperCase()} | ${this.commandCount} ${this.commandType}`;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapService.destroy();
  }
}
