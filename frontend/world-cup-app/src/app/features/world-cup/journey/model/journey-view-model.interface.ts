import { JourneyApiResponse } from './journey-api.interface';

export interface JourneyViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoSimulationState: boolean;
  selectedTeamLabel: string;
  journey: JourneyApiResponse | null;
}
