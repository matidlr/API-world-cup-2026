export interface TeamHistoryApiTitleAchievement {
  org?: string;
  tournament?: string;
  count?: number;
  years?: string[];
  hosts?: string[];
}

export interface TeamHistoryApiResponse {
  titles?: Array<string | TeamHistoryApiTitleAchievement>;
}
