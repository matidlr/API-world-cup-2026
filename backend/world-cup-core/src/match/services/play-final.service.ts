import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { WorldCupApiService } from 'src/basic/world-cup-api.service';
import { WorldCupCoreErrorCode } from 'src/basic/model/world-cup-core-error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';
import { CurrentWorldCupApiResponse, MessageItemsModel, OptionsModel, PlayFinalModel, WorldCupStatusResponse, StrategyRawItem, FormationsRawItem, SelectStrategy, SelectStrategyResponse, SelectFormationResponse } from './play-final-service.model';

const PLAY_FINAL_UNAVAILABLE_MESSAGE =
  'World Cup simulation is not available yet. Run simulation first.';

const PLAY_FINAL_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
    message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
    message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
    statusCode: HttpStatus.CONFLICT,
  },
};

const PLAY_FINAL_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_FETCH_FAILED,
  message: 'Unable to load simulation data from World Cup API.',
  statusCode: HttpStatus.BAD_GATEWAY,
};


@Injectable()
export class PlayFinalService extends AbstractBaseService {
constructor(
    worldCupApiService: WorldCupApiService,
    adminService: AdminService,
  ) {
    super(adminService, worldCupApiService);
  }

  // Método 1: verifica el estado del mundial
  public async getWorldCupStatus(lang?: string) {
    try {
      const resolvedLang = this.resolveLang(lang); 
      const worldCup = await this.getEndpointData<WorldCupStatusResponse>('/world-cup/current', { lang: resolvedLang });
      return {
        canStartFinal:     worldCup.canStartFinal,
        hasActiveFinal:    worldCup.hasActiveFinal,
        status:            worldCup.status,
        finalHomeTeamName: worldCup.finalHomeTeamName,
        finalAwayTeamName: worldCup.finalAwayTeamName,
      };
    } catch (error) {
      ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
    }
  }

  // Método 2: inicia la final
  public async startFinal(lang?: string) {
    try {
      const resolvedLang = this.resolveLang(lang);
      const teamId = this.getCurrentTeamId();  // ✅ del .env
      const matchData = await this.postEndpointData<PlayFinalModel>('/match/start-final', { lang: resolvedLang, teamId });
      return {
        matchId:             matchData.matchId,
        teamId:              matchData.teamId,
        opponentId:          matchData.opponentId,
        teamName:            matchData.teamName,
        opponentName:        matchData.opponentName,
        score:               matchData.score,
        minute:              matchData.minute,
        turn:                matchData.turn,
        zone:                matchData.zone ?? null,
        possession:          matchData.possession ?? null,
        ballCarrier:         matchData.ballCarrier ?? null,
        teamStrategy:        matchData.teamStrategy ?? null,
        teamFormation:       matchData.teamFormation ?? null,
        teamCoachName:       matchData.teamCoachName ?? null,
        teamCoachProfile:    matchData.teamCoachProfile ?? null,
        opponentStrategy:    matchData.opponentStrategy ?? null,
        opponentFormation:   matchData.opponentFormation ?? null,
        opponentCoachName:   matchData.opponentCoachName ?? null,
        opponentCoachProfile: matchData.opponentCoachProfile ?? null,
        eventType:           matchData.eventType,
        isFinished:          matchData.isFinished,
        result:              matchData.result ?? null,  // ✅ sin typo
        messageItems:        this.mapMessageItems(matchData.messageItems ?? []),  // ✅
        options:             this.mapOptions(matchData.options ?? []),
      };
    } catch (error) {
      ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
    }
  }

  public async postPlayTurn(lang: string) {
    try {
      const resolvedLang = this.resolveLang(lang);
      const turn = await this.postEndpointData<PlayFinalModel>('/match/play', {lang: resolvedLang});
      return{
        messageItems:        this.mapMessageItems(turn.messageItems ?? []),  // ✅
        options:             this.mapOptions(turn.options ?? []),
      }

    } catch (error) {
      ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
    }
    
  }

  public async getStrategies(lang?: string) {
  try {
    const resolvedLang = this.resolveLang(lang);
    const strategies = await this.getEndpointData<StrategyRawItem[]>(
      '/match/strategies',
      { lang: resolvedLang }
    );

    return (strategies ?? []).map(item => ({
      strategy:             item.strategy,
      description:          item.description,
      compatibleFormations: item.compatibleFormations ?? [],
      strategyLineImpact: {
        attack:   item.strategyLineImpact?.attack ?? 0,
        defense:  item.strategyLineImpact?.defense ?? 0,
        midfield: item.strategyLineImpact?.midfield ?? 0,
      },
    }));

  } catch (error) {
    ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
  }
}

 public async getFormations(lang?: string) {
  try {
    const resolvedLang = this.resolveLang(lang);
    const formations = await this.getEndpointData<FormationsRawItem[]>(
      '/match/formations',
      { lang: resolvedLang }
    );

    return (formations ?? []).map(item => ({
      formation:             item.formation,
      description:          item.description,
      compatibleStrategies: item.compatibleStrategies ?? [],
    }));

  } catch (error) {
    ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
  }
}

public async selectStrategy(strategy: string, lang?: string) {
  try {
    const resolvedLang = this.resolveLang(lang);
    const teamId = this.getCurrentTeamId();

    const selStra = await this.postEndpointData<SelectStrategyResponse>(
      '/match/select-strategy',
      {
        teamId,
        strategy,
        lang: resolvedLang,
      }
    );

    return {
      teamId: selStra.teamId,
      strategy: selStra.strategy,
      formation: selStra.formation,
      formationAutoAdjusted: selStra.formationAutoAdjusted,
      message: selStra.message,
    };

  } catch (error) {
    ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
  }
}

public async selectFormation(formation: string, lang?: string) {
  try {
    const resolvedLang = this.resolveLang(lang);
    const teamId = this.getCurrentTeamId();
    

    const selStra = await this.postEndpointData<SelectFormationResponse>(
      '/match/select-formation',
      {
        teamId,
        formation,
        lang: resolvedLang,
      }
    );

    return {
      teamId: selStra.teamId,
      formation: selStra.formation,
      message: selStra.message,
    };

  } catch (error) {
    ErrorUtils.mapWorldCupApiError(error, PLAY_FINAL_API_ERROR_STATUS_MAP, PLAY_FINAL_API_ERROR_FALLBACK);
  }
}

  private mapMessageItems(items: any[]): MessageItemsModel[] {
    return items.map(item => new MessageItemsModel({
      messageKey: item.messageKey ?? null,
      type:       item.type,
      text:       item.text,
      minute:     item.minute,
      turn:       item.turn,
      teamId:     item.teamId ?? null,
      teamName:   item.teamName ?? null,
      playerName: item.playerName ?? null,
    }));
  }

  private mapOptions(items: any[]): OptionsModel[] {
    return items.map(item => new OptionsModel({
      index:  item.index,
      label:  item.label,
      action: item.action,
    }));
  }
}


 
