import { TeamHistorySectionItem, TeamHistoryTitleItem } from './team-history-api.interface';

export interface TeamHistoryViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  errorMessage: string;
  selectedTeamLabel: string;
  totalTitles: number;
  totalCompetitions: number;
  organizations: string[];
  titles: TeamHistoryTitleItem[];
  sections: TeamHistorySectionItem[];
}
