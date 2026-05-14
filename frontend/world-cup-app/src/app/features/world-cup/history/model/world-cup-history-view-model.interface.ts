import { HistoricalWorldCupItem } from './world-cup-history-api.interface';

export interface WorldCupHistoryViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoDataState: boolean;
  totalWorldCups: number;
  worldCups: HistoricalWorldCupItem[];
}
