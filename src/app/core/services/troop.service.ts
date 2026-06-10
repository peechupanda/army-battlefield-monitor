import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Troop, TroopStats, SectorName } from '../models/troop.model';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class TroopService {
  constructor(private data: DataService) {}

  getAll(): Observable<Troop[]> {
    return this.data.getTroops();
  }

  getByStatus(status: Troop['status']): Observable<Troop[]> {
    return this.data.getTroops().pipe(
      map(troops => troops.filter(t => t.status === status))
    );
  }

  getBySector(sector: SectorName): Observable<Troop[]> {
    return this.data.getTroops().pipe(
      map(troops => troops.filter(t => t.sector === sector))
    );
  }

  getStats(): Observable<TroopStats> {
    return this.data.getTroops().pipe(
      map(troops => {
        const active  = troops.filter(t => t.status === 'active').length;
        const injured = troops.filter(t => t.status === 'injured').length;
        const reserve = troops.filter(t => t.status === 'reserve').length;
        const total   = troops.length;
        return {
          active, injured, reserve, total,
          combatReadyPct: total > 0 ? Math.round((active / total) * 100) : 0,
        };
      })
    );
  }

  getSectorBreakdown(): Observable<Record<SectorName, TroopStats>> {
    return this.data.getTroops().pipe(
      map(troops => {
        const sectors: SectorName[] = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
        const result = {} as Record<SectorName, TroopStats>;
        for (const s of sectors) {
          const sec = troops.filter(t => t.sector === s);
          const active  = sec.filter(t => t.status === 'active').length;
          const injured = sec.filter(t => t.status === 'injured').length;
          const reserve = sec.filter(t => t.status === 'reserve').length;
          const total   = sec.length;
          result[s] = { active, injured, reserve, total,
            combatReadyPct: total > 0 ? Math.round((active / total) * 100) : 0 };
        }
        return result;
      })
    );
  }

  updateStatus(troopId: string, status: Troop['status']): Observable<void> {
    return this.data.updateTroopStatus(troopId, status);
  }
}
