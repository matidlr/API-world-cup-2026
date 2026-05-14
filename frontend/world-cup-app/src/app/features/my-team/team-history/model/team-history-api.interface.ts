export interface TeamHistoryTitleItem {
  org: string;
  tournament: string;
  count: number;
  years: string[];
  hosts: string[];
  label: string;
}

export interface TeamHistorySectionItem {
  key: string;
  title: string;
  icon: string;
  count: number;
  chips: string[];
}

export interface TeamHistoryApiResponse {
  teamId: string;
  totalTitles: number;
  totalCompetitions: number;
  organizations: string[];
  titles: TeamHistoryTitleItem[];
  sections: TeamHistorySectionItem[];
}
