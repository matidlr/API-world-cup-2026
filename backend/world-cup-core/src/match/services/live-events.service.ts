import { HttpStatus, Injectable } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';
import { AbstractBaseService } from 'src/basic/abstract-base.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from 'src/basic/error/error.utils';
import { WorldCupCoreErrorCode } from 'src/basic/model/world-cup-core-error-code.enum';
import { WorldCupApiService } from 'src/basic/world-cup-api.service';

const LIVE_EVENTS_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_LIVE_EVENTS_UNAVAILABLE,
    message: 'No hay final activa en este momento.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_LIVE_EVENTS_UNAVAILABLE,
    message: 'No hay final activa en este momento.',
  },
};

const LIVE_EVENTS_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_LIVE_EVENTS_UNAVAILABLE,
  message: 'No se pudieron cargar los eventos en vivo.',
  statusCode: HttpStatus.BAD_GATEWAY,
};



interface MatchStatsResponse {
  matchId: string;
  isActive: boolean;
  isFinished: boolean;
  minute: number;
  turn: number;
  score: string;
  team: {
    id: string;
    name: string;
    strategy: string | null;
    formation: string | null;
    coachName: string | null;
    coachProfile: string | null;
  };
  opponent: {
    id: string;
    name: string;
    strategy: string | null;
    formation: string | null;
    coachName: string | null;
    coachProfile: string | null;
  };
  summary: {
    teamGoals: number;
    opponentGoals: number;
    teamYellowCards: number;
    teamRedCards: number;
    opponentYellowCards: number;
    opponentRedCards: number;
  };
  events: {
    statId: number;
    minute: number;
    turn: number;
    eventType: string;
    zone: string | null;
    action: string | null;
    teamId: string | null;
    teamName: string | null;
    playerName: string | null;
    playerPosition: string | null;
    cardType: string | null;
    isGoal: boolean;
    message: string;
    creationDate: string;
  }[];
}
@Injectable()
export class LiveEventsService extends AbstractBaseService {
   constructor(
    worldCupApiService: WorldCupApiService,
    adminService: AdminService
   ) { 
    super(adminService, worldCupApiService);
   }

   public async getStats(lang?: string) {
    try {
      const resolvedLang = this.resolveLang(lang);
      const allData = await this.getEndpointData<MatchStatsResponse>('/match/current/stats', {lang: resolvedLang});
      return {
        // live events api response
        teamId: this.getCurrentTeamId(),
        lang: resolvedLang,
        matchId: allData.matchId,
        isActive: allData.isActive,
        isFinished: allData.isFinished,
        minute: allData.minute,
        turn: allData.turn,
        score: allData.score,
        zone: null,
        zoneLabel: '',
        playerOfMatch: null,
        
        // live events team api item

         team: {
            id: allData.team.id,
            name: allData.team.name,
            flag: allData.team.id?.toUpperCase() ?? '',   
            strategy: allData.team.strategy ?? '', 
            strategyLabel: allData.team.strategy ?? '',
            formation: allData.team.formation ?? '',
            coachName: allData.team.coachName ?? '',
            coachProfile: allData.team.coachProfile ?? '', 
         },
         // live events opponent api item
          opponent: {
              id: allData.opponent.id,
              name: allData.opponent.name,
              flag: allData.opponent.id?.toUpperCase() ?? '',
              strategy: allData.opponent.strategy ?? '',
              strategyLabel: allData.opponent.strategy ?? '',
              formation: allData.opponent.formation ?? '',
              coachName: allData.opponent.coachName ?? '',
              coachProfile: allData.opponent.coachProfile ?? '',
            },

            //live events summari api item
          summary: {
              teamGoals: allData.summary.teamGoals,
              opponentGoals: allData.summary.opponentGoals,
              teamYellowCards: allData.summary.teamYellowCards,
              teamRedCards: allData.summary.teamRedCards,
              opponentYellowCards: allData.summary.opponentYellowCards,
              opponentRedCards: allData.summary.opponentRedCards,
              totalGoals: allData.summary.teamGoals + allData.summary.opponentGoals,
              },

              //events api feed 
          events: (allData.events ?? []).map(ev => ({
              statId:         ev.statId,
              minute:         ev.minute,
              minuteLabel:    `${ev.minute}'`,
              turn:           ev.turn,
              type:           ev.eventType,
              zone:           ev.zone ?? null,
              style:          this.resolveStyle(ev.eventType, ev.isGoal),
              icon:           this.resolveIcon(ev.eventType, ev.isGoal),
              action:         ev.action ?? null,
              teamId:         ev.teamId ?? null,
              teamName:       ev.teamName ?? null,
              playerName:     ev.playerName ?? null,
              playerPosition: ev.playerPosition ?? null,
              cardType:       ev.cardType ?? null,
              isGoal:         ev.isGoal,
              text:           ev.message,
              creationDate:   ev.creationDate,
            }))

      }
    } catch (error) {
       ErrorUtils.mapWorldCupApiError(error, LIVE_EVENTS_ERROR_STATUS_MAP, LIVE_EVENTS_ERROR_FALLBACK);
    }

   }

   private resolveIcon(eventType: string, isGoal: boolean): string {
  if (isGoal)                              return '⚽';
  if (eventType?.includes('YELLOW'))       return '🟨';
  if (eventType?.includes('RED_CARD'))     return '🟥';
  if (eventType?.includes('FOUL'))         return '🦵';
  if (eventType?.includes('ATTACK'))       return '⚡';
  if (eventType?.includes('HALF_TIME'))    return '⏸️';
  if (eventType?.includes('KICKOFF'))      return '▶️';
  if (eventType?.includes('END'))          return '🏁';
  if (eventType?.includes('SUB'))          return '🔄';
  return 'ℹ️';
}

private resolveStyle(eventType: string, isGoal: boolean): string {
  if (isGoal)                              return 'goal';
  if (eventType?.includes('YELLOW'))       return 'yellow';
  if (eventType?.includes('RED_CARD'))     return 'red';
  if (eventType?.includes('SUB'))          return 'sub';
  return 'info';
}

  
}
