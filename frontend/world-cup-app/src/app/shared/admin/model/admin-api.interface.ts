import { Team } from '../../../core/models/team.interface';

export type AppLang = 'es' | 'en';

export interface AdminConfigData {
  teamId: string;
  lang: AppLang;
}

export interface AdminCurrentTeamData {
  team: Team;
  lang: AppLang;
}
