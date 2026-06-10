import { SectorName } from './troop.model';

export type CommandType =
  | 'DEPLOY'
  | 'EXTRACT'
  | 'MEDEVAC'
  | 'REINFORCE'
  | 'AIRSTRIKE'
  | 'ALERT';

export type TroopType = 'Infantry' | 'Armoured' | 'Artillery' | 'Engineers' | 'Medical';

export interface Command {
  id: string;
  type: CommandType;
  sector: SectorName;
  troopType?: TroopType;
  count?: number;
  issuedAt: Date;
  issuedBy: string;
  status: 'pending' | 'acknowledged' | 'completed' | 'failed';
  notes?: string;
}
