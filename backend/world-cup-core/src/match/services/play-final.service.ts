import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { CurrentWorldCupApiResponse } from '../model/play-final-service.interface';
import { WorldCupApiService } from 'src/basic/world-cup-api.service';
import { WorldCupCoreErrorCode } from 'src/basic/model/world-cup-core-error-code.enum';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';
import { MessageItemsModel, OptionsModel, PlayFinalModel } from './play-final-service.model';

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
  constructor(  worldCupApiService: WorldCupApiService, 
               adminService: AdminService
  ){super(adminService, worldCupApiService)}

  public async getCurrentFinal(lang?: string) {
  try {
    const resolvedLang = this.resolveLang(lang);
    const teamId = this.getCurrentTeamId();

    const final = await this.postEndpointData<PlayFinalModel>(
      '/match/start-final',
      { lang: resolvedLang, teamId },  

    
    );
    const know = await this.getEndpointData<CurrentWorldCupApiResponse>(
      '/world-cup/current',
      { lang: resolvedLang }
    )
    
    return {
      matchId:          final.matchId,
      teamId:           final.teamId,
      opponentId:       final.opponentId,
      teamName:         final.teamName,
      opponentName:     final.opponentName,
      score:            final.score,
      minute:           final.minute,
      turn:             final.turn,
      zone:             final.zone ?? null,
      possession:       final.possession ?? null,
      ballCarrier:      final.ballCarrier ?? null,
      teamStrategy:     final.teamStrategy ?? null,
      teamFormation:    final.teamFormation ?? null,
      teamCoachName:    final.teamCoachName ?? null,
      teamCoachProfile: final.teamCoachProfile ?? null,
      opponentStrategy:  final.opponentStrategy ?? null,
      opponentFormation: final.opponentFormation ?? null,
      opponentCoachName: final.opponentCoachName ?? null,
      opponentCoachProfile: final.opponentCoachProfile ?? null,
      eventType:        final.eventType,
      isFinished:       final.isFinished,
      result:           final.result ?? null,
      messageItems:     this.mapMessageItems(final.messageItems ?? []), 
      options:          this.mapOptions(final.options ?? []), 
    };

  } catch (error) {
    ErrorUtils.mapWorldCupApiError(
      error,
      PLAY_FINAL_API_ERROR_STATUS_MAP,
      PLAY_FINAL_API_ERROR_FALLBACK,
    );
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


 
