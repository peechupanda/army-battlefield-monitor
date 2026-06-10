import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommandService } from '../../core/services/command.service';
import { TroopService } from '../../core/services/troop.service';
import { Command } from '../../core/models/command.model';
import { SectorName, TroopStats } from '../../core/models/troop.model';
import { TroopType } from '../../core/models/command.model';

interface LogEntry { time: string; msg: string; color: string; }

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-center.component.html',
  styleUrls: ['./command-center.component.scss'],
})
export class CommandCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sector: SectorName = 'Alpha';
  troopType: TroopType = 'Infantry';
  count = 25;
  sectorStats: Record<string, TroopStats> = {};
  log: LogEntry[] = [];
  isProcessing = false;

  readonly sectors: SectorName[] = ['Alpha','Bravo','Charlie','Delta'];
  readonly troopTypes: TroopType[] = ['Infantry','Armoured','Artillery','Engineers','Medical'];
  sectorColor = (n: string): string => ({ Alpha:'#3fb950', Bravo:'#f85149', Charlie:'#58a6ff', Delta:'#d29922' } as any)[n] ?? '#8b949e';

  readonly commands = [
    { type: 'DEPLOY'    as const, label: '▶ DEPLOY',    color: '#3fb950', bg: '#1a3a1a', desc: 'Send troops to the selected sector' },
    { type: 'EXTRACT'   as const, label: '◀ EXTRACT',   color: '#58a6ff', bg: '#1a1a2e', desc: 'Withdraw active troops from sector' },
    { type: 'MEDEVAC'   as const, label: '✦ MEDEVAC',   color: '#f85149', bg: '#3a1a1a', desc: 'Dispatch medical evacuation' },
    { type: 'REINFORCE' as const, label: '↑ REINFORCE', color: '#a371f7', bg: '#1a1a2e', desc: 'Activate reserve troops in sector' },
    { type: 'AIRSTRIKE' as const, label: '✈ AIRSTRIKE', color: '#ff9a3c', bg: '#2a1a1a', desc: 'Authorise air strike on enemy positions' },
    { type: 'ALERT'     as const, label: '⚠ ALERT',     color: '#d29922', bg: '#2a1e0a', desc: 'Raise manual alert for sector' },
  ];

  constructor(private commandService: CommandService, private troopService: TroopService) {}

  ngOnInit(): void {
    this.troopService.getSectorBreakdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => this.sectorStats = b);

    // Load existing log
    this.rebuildLog();
  }

  issue(type: Command['type']): void {
    this.isProcessing = true;
    this.commandService.issue({ type, sector: this.sector, troopType: this.troopType, count: this.count })
      .subscribe({
        next: (cmd) => {
          this.isProcessing = false;
          this.rebuildLog();
        },
        error: () => { this.isProcessing = false; },
      });
  }

  private rebuildLog(): void {
    const colorMap: Record<string, string> = {
      DEPLOY:'#3fb950', EXTRACT:'#58a6ff', MEDEVAC:'#f85149',
      REINFORCE:'#a371f7', AIRSTRIKE:'#ff9a3c', ALERT:'#d29922',
    };
    this.log = this.commandService.getLog().slice(0, 20).map(cmd => ({
      time: new Date(cmd.issuedAt).toTimeString().slice(0, 8),
      msg: `${cmd.type} → ${cmd.sector?.toUpperCase()} | ${cmd.count ?? ''} ${cmd.troopType ?? ''} [${cmd.status.toUpperCase()}]`,
      color: colorMap[cmd.type] ?? '#8b949e',
    }));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
