import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Command, CommandType, TroopType } from '../models/command.model';
import { SectorName } from '../models/troop.model';
import { DataService } from './data.service';
import { AlertService } from './alert.service';

export interface CommandPayload {
  type: CommandType;
  sector: SectorName;
  troopType?: TroopType;
  count?: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CommandService {
  private commandLog: Command[] = [];

  constructor(private data: DataService, private alertService: AlertService) {}

  issue(payload: CommandPayload): Observable<Command> {
    return this.data.sendCommand({ ...payload, issuedBy: 'CMD-1' }).pipe(
      tap(cmd => {
        this.commandLog.unshift(cmd);
        if (this.commandLog.length > 100) this.commandLog.pop();

        // Auto-generate an alert for critical commands
        const alertMap: Partial<Record<CommandType, { level: 'critical'|'warning'|'info', msg: string }>> = {
          DEPLOY:     { level: 'info',     msg: `${payload.count ?? '?'} ${payload.troopType ?? 'troops'} deployed → Sector ${payload.sector}` },
          EXTRACT:    { level: 'info',     msg: `Extraction order issued for Sector ${payload.sector}` },
          MEDEVAC:    { level: 'warning',  msg: `MEDEVAC dispatched to Sector ${payload.sector}` },
          REINFORCE:  { level: 'info',     msg: `Reinforcements activated in Sector ${payload.sector}` },
          AIRSTRIKE:  { level: 'critical', msg: `AIR STRIKE authorised on Sector ${payload.sector}` },
          ALERT:      { level: 'warning',  msg: `Manual alert raised for Sector ${payload.sector}` },
        };
        const meta = alertMap[payload.type];
        if (meta) this.alertService.dispatch(meta.level, meta.msg, payload.sector);
      })
    );
  }

  getLog(): Command[] {
    return [...this.commandLog];
  }
}
