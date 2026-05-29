import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { CurrentWorldCupApiResponse } from '../model/play-final-service.interface';
import { WorldCupApiService } from 'src/basic/world-cup-api.service';
import { WorldCupCoreErrorCode } from 'src/basic/model/world-cup-core-error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';

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

interface PlayFinalRawResponse {
  matchId: string,
  teamId: string,
  opponentId: string,
  teamName: string,
  opponentName: string,
  messageItems: [
    {
      messageKey: string,
      type: string,
      text: string,
      minute: number,
      turn: number,
      teamId: string,
      teamName: string,
      playerName: string
    }
  ],
  score: string,
  minute: number,
  turn: number,
  zone: string,
  possession: string,
  ballCarrier: string,
  teamStrategy: string,
  teamFormation: string,
  teamCoachName: string,
  teamCoachProfile: string,
  opponentStrategy: string,
  opponentFormation: string,
  opponentCoachName: string,
  opponentCoachProfile: string,
  eventType: string,
  options: [
    {
      index: number,
      label: string,
      action: string
    }
  ],
  isFinished: boolean,
  result: string,
  currentContext: {}
}

@Injectable()
export class PlayFinalService extends AbstractBaseService {
  constructor(  worldCupApiService: WorldCupApiService, 
               adminService: AdminService
  ){super(adminService, worldCupApiService)}

  public async getCurrentFinal(lang?: string): Promise<CurrentWorldCupApiResponse>{
    
    try {
      const resolvedLang = this.resolveLang(lang);
      const teamId = this.getCurrentTeamId();

          const final =  await this.postEndpointData<PlayFinalRawResponse>('/match/start-final', {resolvedLang, teamId});

      return {
         matchId: final.matchId,
         teamId: final.teamId,
         opponentId: final.opponentId,
         teamName: final.teamName,
         opponentName: final.opponentName,

      messageItems: final.messageItems.map(item => ({
        messageKey: item.messageKey,
        type: item.type,
        text: item.text,
        minute: item.minute,
        turn: item.turn,
        teamId: item.teamId,
        teamName: item.teamName,
        playerName: item.playerName
      })),

      score: final.score,
      minute: final.minute,
      turn: final.turn,
      zone: final.zone,
      possession: final.possession,
      ballCarrier: final.ballCarrier,

      teamStrategy: final.teamStrategy,
      teamFormation: final.teamFormation,
      teamCoachName: final.teamCoachName,
      teamCoachProfile: final.teamCoachProfile,

      opponentStrategy: final.opponentStrategy,
      opponentFormation: final.opponentFormation,
      opponentCoachName: final.opponentCoachName,
      opponentCoachProfile: final.opponentCoachProfile,

      eventType: final.eventType,

      options: final.options.map(option => ({
        index: option.index,
        label: option.label,
        action: option.action
      })),

      isFinished: final.isFinished,
      result: final.result,
      currentContext: final.currentContext
    };
       
    } catch (error) {
      ErrorUtils.mapWorldCupApiError(
              error,
              PLAY_FINAL_API_ERROR_STATUS_MAP,
              PLAY_FINAL_API_ERROR_FALLBACK,
            );
    }
  }

  private hasFinalists(worldCup: CurrentWorldCupApiResponse): boolean {
    return Boolean(
      worldCup?.finalHomeTeamId &&
      worldCup?.finalHomeTeamName &&
      worldCup?.finalAwayTeamId &&
      worldCup?.finalAwayTeamName,
    );
  }

  private createPlayFinalUnavailableException(): HttpException {
      return new HttpException(
        {
          messageCode: WorldCupCoreErrorCode.WC_PLAY_FINAL_UNAVAILABLE,
          message: PLAY_FINAL_UNAVAILABLE_MESSAGE,
        },
        HttpStatus.CONFLICT,
      );
    }

    
}


 
