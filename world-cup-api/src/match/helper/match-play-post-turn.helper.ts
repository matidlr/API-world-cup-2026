import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { TeamsService } from 'src/teams/teams.service';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../interfaces/match-localized-turn-message.interface';
import { OpponentTacticalAdjustment } from '../interfaces/match-team-tactical-state.interface';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchAction } from '../model/match-action.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchPlayPostTurnHelperContract } from '../interfaces/match-play-post-turn.interface';
import { MatchPlayStageContext } from '../interfaces/match-play-stage.interface';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchNarrativeHelper } from './match-narrative.helper';
import { MatchPlayResponsePayload } from '../interfaces/match-play-response-payload.interface';

@Injectable()
export class MatchPlayPostTurnHelper implements MatchPlayPostTurnHelperContract {
  constructor(
    private readonly i18nService: I18nService,
    private readonly teamsService: TeamsService,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
  ) {}

  async apply(context: MatchPlayStageContext): Promise<MatchPlayStageContext> {
    const postTurnPayload = context.postTurnPayload;
    const responsePayload = context.responsePayload;
    if (!postTurnPayload || !responsePayload) {
      return context;
    }

    const postTurnResolution = await this.applyRegularPostTurn({
      match: postTurnPayload.match,
      nextMinute: postTurnPayload.nextMinute,
      actingPlayer: postTurnPayload.actingPlayer,
      language: postTurnPayload.language,
      selectedAction: postTurnPayload.selectedAction,
      turnMessages: postTurnPayload.turnMessages,
      turnMessageItems: postTurnPayload.turnMessageItems,
      pushTurnMessage: postTurnPayload.pushTurnMessage,
      baseUserPlayers: postTurnPayload.baseUserPlayers,
      baseOpponentPlayers: postTurnPayload.baseOpponentPlayers,
      userPlayers: postTurnPayload.userPlayers,
      opponentPlayers: postTurnPayload.opponentPlayers,
      shouldEnterHalfTime: postTurnPayload.shouldEnterHalfTime,
      isLastPlayEvent: postTurnPayload.isLastPlayEvent,
      maybeApplyOpponentTacticalAdjustment: postTurnPayload.maybeApplyOpponentTacticalAdjustment,
      resolveHalfTimeSummaryKey: postTurnPayload.resolveHalfTimeSummaryKey,
      resolveHalfTimeVariantKey: postTurnPayload.resolveHalfTimeVariantKey,
      recordMatchStat: postTurnPayload.recordMatchStat,
      prepareLastPlayTurn: postTurnPayload.prepareLastPlayTurn,
      closeMatchAtNinety: postTurnPayload.closeMatchAtNinety,
      buildFinalMessageLocalized: postTurnPayload.buildFinalMessageLocalized,
    });

    const updatedPayload: MatchPlayResponsePayload = {
      ...responsePayload,
      userPlayers: postTurnResolution.refreshedUserPlayers.length
        ? postTurnResolution.refreshedUserPlayers
        : postTurnPayload.baseUserPlayers,
      opponentPlayers: postTurnResolution.refreshedOpponentPlayers.length
        ? postTurnResolution.refreshedOpponentPlayers
        : postTurnPayload.baseOpponentPlayers,
      actionOutcome: responsePayload.actionOutcome || postTurnResolution.actionOutcome,
      currentContext: {
        ...responsePayload.currentContext,
        isPendingSetPiece:
          postTurnPayload.match.eventType === MatchEventType.PENALTY_FOR_EVENT ||
          postTurnPayload.match.eventType === MatchEventType.PENALTY_AGAINST_EVENT,
      },
    };

    return {
      ...context,
      responsePayload: updatedPayload,
    };
  }

  async applyRegularPostTurn(params: {
    match: MatchEntity;
    nextMinute: number;
    actingPlayer: TeamPlayer;
    language: MatchLanguage;
    selectedAction: MatchAction;
    turnMessages: LocalizedTurnMessages;
    turnMessageItems: LocalizedTurnMessageItem[];
    pushTurnMessage: (
      type: MatchMessageType,
      key: string,
      payload?: any,
      metadata?: {
        minute?: number;
        turn?: number;
        teamId?: string | null;
        teamName?: string | null;
        playerName?: string | null;
      },
    ) => void;
    baseUserPlayers: TeamPlayer[];
    baseOpponentPlayers: TeamPlayer[];
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
    shouldEnterHalfTime: (match: MatchEntity) => boolean;
    isLastPlayEvent: (eventType: MatchEventType) => boolean;
    maybeApplyOpponentTacticalAdjustment: (
      match: MatchEntity,
      params: { phase: MatchCoachTacticalPhase; minute: number; eventType: MatchEventType },
    ) => Promise<OpponentTacticalAdjustment | null>;
    resolveHalfTimeSummaryKey: (
      match: MatchEntity,
    ) => 'match.halftime.summary.leading' | 'match.halftime.summary.drawing' | 'match.halftime.summary.trailing';
    resolveHalfTimeVariantKey: () => string;
    recordMatchStat: (params: {
      matchId: string;
      minute: number;
      turn: number;
      eventType: MatchEventType;
      zone?: MatchFieldZone | null;
      action: MatchAction | null;
      teamId: string | null;
      teamName: string | null;
      playerName: string | null;
      playerPosition: string | null;
      cardType: MatchCardType | null;
      isGoal: boolean;
      message: string;
      messageKey?: string | null;
      messageParams?: any;
    }) => Promise<void>;
    prepareLastPlayTurn: (params: {
      match: MatchEntity;
      language: MatchLanguage;
      turnMessages: LocalizedTurnMessages;
      turnMessageItems: LocalizedTurnMessageItem[];
      userPlayers: TeamPlayer[];
      opponentPlayers: TeamPlayer[];
    }) => Promise<void>;
    closeMatchAtNinety: (
      match: MatchEntity,
      userPlayers: TeamPlayer[],
      opponentPlayers: TeamPlayer[],
    ) => Promise<void>;
    buildFinalMessageLocalized: (match: MatchEntity, language: MatchLanguage) => string;
  }): Promise<{
    refreshedUserPlayers: TeamPlayer[];
    refreshedOpponentPlayers: TeamPlayer[];
    selectedAction: MatchAction;
    actionOutcome: MatchActionOutcome | null;
  }> {
    const {
      match,
      nextMinute,
      actingPlayer,
      language,
      turnMessages,
      turnMessageItems,
      pushTurnMessage,
      baseUserPlayers,
      baseOpponentPlayers,
      userPlayers,
      opponentPlayers,
      shouldEnterHalfTime,
      isLastPlayEvent,
      maybeApplyOpponentTacticalAdjustment,
      resolveHalfTimeSummaryKey,
      resolveHalfTimeVariantKey,
      recordMatchStat,
      prepareLastPlayTurn,
      closeMatchAtNinety,
      buildFinalMessageLocalized,
      selectedAction,
    } = params;

    const squadIncidents = await this.matchSquadRulesHelper.applyFatigueAndSquadRules(match, {
      minute: nextMinute,
      actingPlayerId: actingPlayer.playerId,
      eventType: match.eventType as MatchEventType,
    });

    for (const incident of squadIncidents) {
      turnMessages.en.push(incident.en);
      turnMessages.es.push(incident.es);
      turnMessageItems.push({
        type: incident.type,
        en: incident.en,
        es: incident.es,
        minute: incident.minute,
        turn: incident.turn,
        teamId: incident.teamId,
        teamName: incident.teamName,
        playerName: incident.playerName || null,
      });
    }

    const refreshedUserPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      match.matchId,
      match.teamId,
    );
    const refreshedOpponentPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      match.matchId,
      match.opponentId,
    );

    if (!shouldEnterHalfTime(match) && !match.isFinished) {
      const lateGameTacticalAdjustment = await maybeApplyOpponentTacticalAdjustment(match, {
        phase: MatchCoachTacticalPhase.LATE_GAME,
        minute: nextMinute,
        eventType: match.eventType as MatchEventType,
      });
      if (lateGameTacticalAdjustment) {
        pushTurnMessage(
          MatchMessageType.INFO,
          'match.tactics.opponentShift',
          {
            coachName: lateGameTacticalAdjustment.coachName,
            teamName: match.opponentName,
            strategy: lateGameTacticalAdjustment.strategy,
            formation: lateGameTacticalAdjustment.formation,
          },
          {
            minute: nextMinute,
            turn: match.turn,
            teamId: match.opponentId,
            teamName: match.opponentName,
          },
        );

        for (const incident of lateGameTacticalAdjustment.incidents) {
          turnMessages.en.push(incident.en);
          turnMessages.es.push(incident.es);
          turnMessageItems.push({
            type: incident.type,
            en: incident.en,
            es: incident.es,
            minute: incident.minute,
            turn: incident.turn,
            teamId: incident.teamId,
            teamName: incident.teamName,
            playerName: incident.playerName || null,
          });
        }
      }
    }

    if (!match.isFinished && !shouldEnterHalfTime(match)) {
      const currentZone = (match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD;
      const possessionTeamName =
        (match.possessionTeam as MatchPossession) === MatchPossession.USER
          ? match.teamName
          : match.opponentName;
      pushTurnMessage(
        MatchMessageType.INFO,
        'match.turn.flowSnapshot',
        {
          en: {
            teamName: possessionTeamName,
            zone: this.matchNarrativeHelper.describeZone(currentZone, 'en'),
          },
          es: {
            teamName: possessionTeamName,
            zone: this.matchNarrativeHelper.describeZone(currentZone, 'es'),
          },
        },
        {
          minute: nextMinute,
          turn: match.turn,
          teamId: null,
          teamName: null,
        },
      );

      pushTurnMessage(
        MatchMessageType.INFO,
        'match.turn.currentScore',
        {
          scoreTeam: match.scoreTeam,
          scoreOpponent: match.scoreOpponent,
        },
        {
          minute: nextMinute,
          turn: match.turn,
          teamId: null,
          teamName: null,
        },
      );
    }

    if (shouldEnterHalfTime(match)) {
      match.minute = 45;
      match.eventType = MatchEventType.HALF_TIME_EVENT;
      match.currentZone = MatchFieldZone.MIDFIELD;
      match.possessionTeam = MatchPossession.USER;
      const [teamData, opponentData] = await Promise.all([
        this.teamsService.getTeamById(match.teamId),
        this.teamsService.getTeamById(match.opponentId),
      ]);

      const halfTimeTacticalAdjustment = await maybeApplyOpponentTacticalAdjustment(match, {
        phase: MatchCoachTacticalPhase.HALF_TIME,
        minute: 45,
        eventType: MatchEventType.HALF_TIME_EVENT,
      });
      if (halfTimeTacticalAdjustment) {
        pushTurnMessage(
          MatchMessageType.INFO,
          'match.tactics.opponentShift',
          {
            coachName: halfTimeTacticalAdjustment.coachName,
            teamName: match.opponentName,
            strategy: halfTimeTacticalAdjustment.strategy,
            formation: halfTimeTacticalAdjustment.formation,
          },
          {
            minute: 45,
            turn: match.turn,
            teamId: match.opponentId,
            teamName: match.opponentName,
          },
        );

        for (const incident of halfTimeTacticalAdjustment.incidents) {
          turnMessages.en.push(incident.en);
          turnMessages.es.push(incident.es);
          turnMessageItems.push({
            type: incident.type,
            en: incident.en,
            es: incident.es,
            minute: incident.minute,
            turn: incident.turn,
            teamId: incident.teamId,
            teamName: incident.teamName,
            playerName: incident.playerName || null,
          });
        }
      }

      const summaryKey = resolveHalfTimeSummaryKey(match);
      const summaryParams = {
        teamName: match.teamName,
        opponentName: match.opponentName,
        scoreTeam: match.scoreTeam,
        scoreOpponent: match.scoreOpponent,
        teamStrategy: match.strategy,
        opponentStrategy: match.opponentStrategy,
      };
      const summaryEn = this.i18nService.t(summaryKey, 'en', summaryParams);
      const variantKey = resolveHalfTimeVariantKey();

      pushTurnMessage(MatchMessageType.INFO, summaryKey, summaryParams, {
        minute: 45,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
      });
      pushTurnMessage(
        MatchMessageType.INFO,
        variantKey,
        {
          teamName: match.teamName,
          opponentName: match.opponentName,
          teamCoach: teamData.coach,
          opponentCoach: opponentData.coach,
        },
        {
          minute: 45,
          turn: match.turn,
          teamId: null,
          teamName: null,
        },
      );
      pushTurnMessage(MatchMessageType.INFO, 'match.halftime.prompt', undefined, {
        minute: 45,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
      });

      await recordMatchStat({
        matchId: match.matchId,
        minute: 45,
        turn: match.turn,
        eventType: MatchEventType.HALF_TIME_EVENT,
        zone: MatchFieldZone.MIDFIELD,
        action: null,
        teamId: match.teamId,
        teamName: match.teamName,
        playerName: null,
        playerPosition: null,
        cardType: null,
        isGoal: false,
        message: summaryEn,
        messageKey: summaryKey,
        messageParams: summaryParams,
      });
    }

    if (match.turn > match.maxTurns) {
      if (match.scoreTeam === match.scoreOpponent && !isLastPlayEvent(match.eventType as MatchEventType)) {
        match.turn = match.maxTurns;
        await prepareLastPlayTurn({
          match,
          language,
          turnMessages,
          turnMessageItems,
          userPlayers: refreshedUserPlayers.length ? refreshedUserPlayers : baseUserPlayers,
          opponentPlayers: refreshedOpponentPlayers.length ? refreshedOpponentPlayers : baseOpponentPlayers,
        });
      } else {
        await closeMatchAtNinety(
          match,
          refreshedUserPlayers.length ? refreshedUserPlayers : baseUserPlayers,
          refreshedOpponentPlayers.length ? refreshedOpponentPlayers : baseOpponentPlayers,
        );
        pushTurnMessage(MatchMessageType.FINAL, 'match.turn.final', {
          finalMessage: buildFinalMessageLocalized(match, language),
        });
      }
    }

    return {
      refreshedUserPlayers,
      refreshedOpponentPlayers,
      selectedAction,
      actionOutcome: null,
    };
  }
}
