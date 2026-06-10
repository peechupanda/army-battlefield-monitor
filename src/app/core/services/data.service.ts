/**
 * DATA SERVICE — DATABASE INTERFACE
 * ===================================
 * This is the ONLY file you need to modify to connect your database.
 * All other services read from here via Observables.
 *
 * HOW TO CONNECT YOUR DATABASE:
 * ─────────────────────────────
 * Option A — REST API:
 *   Replace each method body with HttpClient calls to your backend.
 *   e.g.  getTroops() { return this.http.get<Troop[]>('/api/troops'); }
 *
 * Option B — Firebase / Firestore:
 *   import { Firestore, collection, collectionData } from '@angular/fire/firestore';
 *   getTroops() { return collectionData(collection(this.firestore, 'troops')); }
 *
 * Option C — Supabase:
 *   const { data } = await this.supabase.from('troops').select('*');
 *   return of(data);
 *
 * Option D — WebSocket (real-time):
 *   Use WebSocketService (see websocket.service.ts) which feeds updates here.
 *
 * Option E — Static JSON / Mock (default, for development):
 *   The mock data below is used until you plug in a real database.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, interval, combineLatest } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { Troop, SectorName } from '../models/troop.model';
import { Alert, Enemy, WarSituation, Mission } from '../models/alert.model';
import { Command } from '../models/command.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {

  // ─── Replace this URL with your actual API base URL ───────────────────────
  private readonly API_URL = environment.apiUrl;   // set in environment.ts
  // ──────────────────────────────────────────────────────────────────────────

  // Internal state subjects (update these from your DB push / polling)
  private troops$    = new BehaviorSubject<Troop[]>(MOCK_TROOPS);
  private alerts$    = new BehaviorSubject<Alert[]>(MOCK_ALERTS);
  private enemies$   = new BehaviorSubject<Enemy[]>(MOCK_ENEMIES);
  private situation$ = new BehaviorSubject<WarSituation>(MOCK_SITUATION);
  private missions$  = new BehaviorSubject<Mission[]>(MOCK_MISSIONS);

  constructor(private http: HttpClient) {
    // ── POLLING EXAMPLE (uncomment + set your real endpoint) ──────────────
    // interval(5000).pipe(
    //   startWith(0),
    //   switchMap(() => this.http.get<Troop[]>(`${this.API_URL}/troops`))
    // ).subscribe(troops => this.troops$.next(troops));
    // ──────────────────────────────────────────────────────────────────────
  }

  // ── READ STREAMS (these are what components subscribe to) ─────────────────

  getTroops(): Observable<Troop[]> {
    // Replace with: return this.http.get<Troop[]>(`${this.API_URL}/troops`);
    return this.troops$.asObservable();
  }

  getAlerts(): Observable<Alert[]> {
    // Replace with: return this.http.get<Alert[]>(`${this.API_URL}/alerts`);
    return this.alerts$.asObservable();
  }

  getEnemies(): Observable<Enemy[]> {
    // Replace with: return this.http.get<Enemy[]>(`${this.API_URL}/enemies`);
    return this.enemies$.asObservable();
  }

  getWarSituation(): Observable<WarSituation> {
    // Replace with: return this.http.get<WarSituation>(`${this.API_URL}/situation`);
    return this.situation$.asObservable();
  }

  getMissions(): Observable<Mission[]> {
    // Replace with: return this.http.get<Mission[]>(`${this.API_URL}/missions`);
    return this.missions$.asObservable();
  }

  // ── WRITE METHODS (commands sent to your backend) ─────────────────────────

  sendCommand(command: Omit<Command, 'id' | 'issuedAt' | 'status'>): Observable<Command> {
    const full: Command = {
      ...command,
      id: crypto.randomUUID(),
      issuedAt: new Date(),
      status: 'pending',
    };
    // Replace with: return this.http.post<Command>(`${this.API_URL}/commands`, full);
    console.log('[COMMAND]', full);
    return of({ ...full, status: 'acknowledged' });
  }

  acknowledgeAlert(alertId: string): Observable<void> {
    // Replace with: return this.http.patch<void>(`${this.API_URL}/alerts/${alertId}`, { acknowledged: true });
    const current = this.alerts$.value.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
    this.alerts$.next(current);
    return of(void 0);
  }

  updateTroopStatus(troopId: string, status: Troop['status']): Observable<void> {
    // Replace with: return this.http.patch<void>(`${this.API_URL}/troops/${troopId}`, { status });
    const current = this.troops$.value.map(t =>
      t.id === troopId ? { ...t, status, lastUpdated: new Date() } : t
    );
    this.troops$.next(current);
    return of(void 0);
  }

  // ── PUSH FROM WEBSOCKET (call this from WebSocketService) ─────────────────

  pushTroopUpdate(troop: Troop): void { this.troops$.next([...this.troops$.value.filter(t => t.id !== troop.id), troop]); }
  pushAlert(alert: Alert): void { this.alerts$.next([alert, ...this.alerts$.value].slice(0, 50)); }
  pushEnemyUpdate(enemy: Enemy): void { this.enemies$.next([...this.enemies$.value.filter(e => e.id !== enemy.id), enemy]); }
  pushSituationUpdate(sit: WarSituation): void { this.situation$.next(sit); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MOCK DATA — Remove once your real database is connected
// ═══════════════════════════════════════════════════════════════════════════

const SECTORS: SectorName[] = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
const SECTOR_COORDS: Record<SectorName, [number,number]> = {
  Alpha:   [28.65, 77.20], Bravo:  [28.68, 77.25],
  Charlie: [28.60, 77.20], Delta:  [28.62, 77.25],
};
const NAMES = ['Arjun Kumar','Vikram Singh','Rajesh Sharma','Suresh Patel','Mahesh Yadav',
               'Rahul Gupta','Rohan Joshi','Kapil Nair','Vijay Reddy','Anil Rao'];
const RANKS = ['Pvt','Cpl','Sgt','SSgt','WO','2Lt','Lt','Capt','Maj'];
const UNITS = ['1 INFANTRY','2 ARMOURED','3 ARTILLERY','4 ENGINEERS','5 MEDICAL'];
const STATUSES: Troop['status'][] = ['active','active','active','active','injured','reserve'];

function rnd(a: number, b: number) { return Math.random() * (b - a) + a; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const MOCK_TROOPS: Troop[] = Array.from({ length: 40 }, (_, i) => {
  const sector = pick(SECTORS);
  const [baseLat, baseLng] = SECTOR_COORDS[sector];
  return {
    id: `T${String(i + 1).padStart(3, '0')}`,
    name: pick(NAMES),
    rank: pick(RANKS),
    unit: pick(UNITS),
    status: pick(STATUSES),
    sector,
    latitude:  baseLat + rnd(-0.02, 0.02),
    longitude: baseLng + rnd(-0.02, 0.02),
    lastUpdated: new Date(Date.now() - rnd(0, 3600000)),
  };
});

const MOCK_ALERTS: Alert[] = [
  { id:'a1', level:'critical', message:'Enemy armour column detected Sector Alpha, Grid 4-7', sector:'Alpha', timestamp: new Date(Date.now()-120000), acknowledged:false },
  { id:'a2', level:'warning',  message:'Ammo critically low Sector Bravo — resupply required', sector:'Bravo', timestamp: new Date(Date.now()-55000),  acknowledged:false },
  { id:'a3', level:'info',     message:'Reinforcements arrived Sector Charlie — 50 troops',    sector:'Charlie', timestamp: new Date(Date.now()-20000), acknowledged:false },
];

const MOCK_ENEMIES: Enemy[] = Array.from({ length: 8 }, (_, i) => ({
  id: `E${i + 1}`,
  latitude:  28.60 + rnd(0, 0.10),
  longitude: 77.18 + rnd(0, 0.10),
  strength: Math.floor(rnd(15, 80)),
  type: pick(['infantry','armour','artillery']),
  lastSeen: new Date(Date.now() - rnd(0, 1800000)),
  confirmed: Math.random() > 0.3,
}));

const MOCK_SITUATION: WarSituation = {
  phase: 'offensive', territoryControlPct: 62, kiaToday: 4,
  wiaToday: 12, missionsCompleted: 3, missionsTotal: 8, threatLevel: 'high',
};

const MOCK_MISSIONS: Mission[] = [
  { id:'m1', name:'Operation Falcon', sector:'Alpha', status:'active',    type:'offensive', startTime: new Date() },
  { id:'m2', name:'Recon Bravo-7',    sector:'Bravo', status:'completed', type:'recon',     startTime: new Date() },
  { id:'m3', name:'Supply Run Delta', sector:'Delta', status:'pending',   type:'supply' },
];
