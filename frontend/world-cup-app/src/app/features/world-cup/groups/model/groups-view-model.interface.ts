import { GroupTableApiItem } from './groups-api.interface';

export interface GroupsViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  showNoSimulationState: boolean;
  selectedTeamLabel: string;
  selectedGroup: string | null;
  selectedGroupData: GroupTableApiItem | null;
  groups: GroupTableApiItem[];
}
