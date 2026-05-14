import { Injectable } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { AbstractBaseService } from './abstract-base.service';
import { LanguageEnum } from './model/language.enum';
import { WorldCupApiService } from './world-cup-api.service';
import type { GameDictionaryApiResponse, SquadPlayerApiItem } from '../teams/services/model/squad-service.interface';
import type { TeamHistoryApiResponse } from '../teams/services/model/team-history-service.interface';
import type {
  CurrentWorldCupApiResponse,
  TeamCatalogApiItem,
  TeamStatsApiResponse,
} from '../world-cup/services/model/simulation-service.interface';

@Injectable()
export class WorldCupFeatureApiService extends AbstractBaseService {
  constructor(
    worldCupApiService: WorldCupApiService,
    adminService: AdminService,
  ) {
    super(adminService, worldCupApiService);
  }

  public getCurrentTeamId(): string {
    return super.getCurrentTeamId();
  }

  public getCurrentLang(): LanguageEnum {
    return super.getCurrentLang();
  }

  public async getTeamPlayers(teamId: string, lang?: string): Promise<SquadPlayerApiItem[]> {
    return this.getEndpointData<SquadPlayerApiItem[]>(`/teams/${teamId}/players`, {
      lang: this.resolveLang(lang),
    });
  }

  public async getGameDictionary(lang?: string): Promise<GameDictionaryApiResponse> {
    return this.getEndpointData<GameDictionaryApiResponse>('/reference/game-dictionary', {
      lang: this.resolveLang(lang),
    });
  }

  public async getTeamHistory(teamId: string, lang?: string): Promise<TeamHistoryApiResponse> {
    return this.getEndpointData<TeamHistoryApiResponse>(`/teams/${teamId}/history`, {
      lang: this.resolveLang(lang),
    });
  }

  public async listTeams(teamId?: string, name?: string): Promise<TeamCatalogApiItem[]> {
    return this.getEndpointData<TeamCatalogApiItem[]>('/teams', {
      teamId: teamId?.trim().toLowerCase(),
      name: name?.trim(),
    });
  }

  public async getTeamStats(teamId: string, lang?: string): Promise<TeamStatsApiResponse> {
    return this.getEndpointData<TeamStatsApiResponse>(`/teams/${teamId}/stats`, {
      lang: this.resolveLang(lang),
    });
  }

  public async getCurrentWorldCup(lang?: string): Promise<CurrentWorldCupApiResponse> {
    return this.getEndpointData<CurrentWorldCupApiResponse>('/world-cup/current', {
      lang: this.resolveLang(lang),
    });
  }

  public async simulateWorldCup(teamId: string, lang?: string): Promise<CurrentWorldCupApiResponse> {
    return this.postEndpointData<CurrentWorldCupApiResponse>('/world-cup/simulate', {
      teamId,
      lang: this.resolveLang(lang),
    });
  }
}
