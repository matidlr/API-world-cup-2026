import { SimulationApiResponse } from './simulate-api.interface';

export interface SimulateViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  simulating: boolean;
  errorMessage: string;
  showNoSimulationState: boolean;
  simulation: SimulationApiResponse | null;
}
