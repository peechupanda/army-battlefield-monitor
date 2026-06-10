import { SectorName } from './troop.model';

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  sector?: SectorName;
  timestamp: Date;
  acknowledged: boolean;
  source?: string;
}

export interface Enemy {
  id: string;
  latitude: number;
  longitude: number;
  strength: number;      // estimated troop count 0-100
  type?: string;         // 'infantry' | 'armour' | 'artillery'
  lastSeen: Date;
  confirmed: boolean;
}

export interface Mission {
  id: string;
  name: string;
  sector: SectorName;
  status: 'pending' | 'active' | 'completed' | 'failed';
  type: 'offensive' | 'defensive' | 'recon' | 'medevac' | 'supply';
  startTime?: Date;
  endTime?: Date;
}

export interface WarSituation {
  phase: 'offensive' | 'defensive' | 'holding' | 'advance' | 'withdrawal';
  territoryControlPct: number;   // 0–100, friendly control
  kiaToday: number;
  wiaToday: number;
  missionsCompleted: number;
  missionsTotal: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}
