import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert, AlertLevel } from '../models/alert.model';
import { DataService } from './data.service';
import { SectorName } from '../models/troop.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor(private data: DataService) {}

  getAll(): Observable<Alert[]> {
    return this.data.getAlerts();
  }

  getUnacknowledged(): Observable<Alert[]> {
    return this.data.getAlerts().pipe(
      map(alerts => alerts.filter(a => !a.acknowledged))
    );
  }

  getByLevel(level: AlertLevel): Observable<Alert[]> {
    return this.data.getAlerts().pipe(
      map(alerts => alerts.filter(a => a.level === level))
    );
  }

  getCount(): Observable<number> {
    return this.getUnacknowledged().pipe(map(a => a.length));
  }

  acknowledge(alertId: string): Observable<void> {
    return this.data.acknowledgeAlert(alertId);
  }

  // Push a new alert (e.g. from a command action)
  dispatch(level: AlertLevel, message: string, sector?: SectorName): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      level,
      message,
      sector,
      timestamp: new Date(),
      acknowledged: false,
      source: 'COMMAND CENTER',
    };
    this.data.pushAlert(alert);
  }
}
