import { PlayFinalApiResponse } from './the-final-api.interface';

export interface TheFinalViewModel {
  lang:             'es' | 'en';
  loading:          boolean;
  errorMessage:     string;
  showNoFinalState: boolean;   
  showWorldCupNotReady: boolean; 
  data:             PlayFinalApiResponse | null;
}