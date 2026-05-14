import { RivalItem } from './rivals-api.interface';

export interface RivalsViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  selectedTeamLabel: string;
  totalRivals: number;
  rivals: RivalItem[];
}
