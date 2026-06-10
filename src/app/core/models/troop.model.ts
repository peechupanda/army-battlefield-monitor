export type TroopStatus = 'active' | 'injured' | 'reserve';
export type SectorName = 'Alpha' | 'Bravo' | 'Charlie' | 'Delta';

export interface Troop {
  id: string;
  name: string;
  rank: string;
  unit: string;
  status: TroopStatus;
  sector: SectorName;
  latitude: number;    // real GPS lat from your DB
  longitude: number;   // real GPS lng from your DB
  age?: number;
  bloodGroup?: string;
  contact?: string;
  lastUpdated: Date;
  notes?: string;
}

export interface TroopStats {
  active: number;
  injured: number;
  reserve: number;
  total: number;
  combatReadyPct: number;
}
