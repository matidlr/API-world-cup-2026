import { LiveEventsApiResponse } from './live-events-api.interface';

export interface LiveEventsViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoFinalState: boolean;
  data: LiveEventsApiResponse | null;
}
