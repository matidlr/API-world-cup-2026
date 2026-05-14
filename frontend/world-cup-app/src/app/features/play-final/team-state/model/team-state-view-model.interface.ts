import { TeamStateApiResponse } from './team-state-api.interface';

export interface TeamStateViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoFinalState: boolean;
  data: TeamStateApiResponse | null;
}
