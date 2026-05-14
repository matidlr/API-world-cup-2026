import { Injectable } from '@nestjs/common';
import { I18nService, TranslationParams } from 'src/i18n/i18n.service';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchMessageType } from '../model/match-message-type.enum';
import {
  MatchOutcomeMessageDescriptor,
  MatchOutcomeMessageHelperContract,
  MatchOutcomeNarrativeMode,
  ResolveOutcomeMessageParams,
  ResolveRestartOutcomeMessageParams,
} from '../interfaces/match-outcome-message.interface';
import { MatchNarrativeVariantHelper } from './match-narrative-variant.helper';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';

@Injectable()
export class MatchOutcomeMessageHelper
  extends AbstractMatchI18nHelper
  implements MatchOutcomeMessageHelperContract
{
  constructor(
    private readonly i18nService: I18nService,
    private readonly matchNarrativeVariantHelper: MatchNarrativeVariantHelper,
  ) {
    super();
  }

  resolveOutcomeMessage(params: ResolveOutcomeMessageParams): MatchOutcomeMessageDescriptor {
    const { match, turnOutcome, action, minute, turn, mode, lastPlayAttackingTeamId } = params;
    const penaltyAwardedIncident =
      turnOutcome.incidents.find(
        (incident) => incident.type === MatchActionOutcomeIncidentType.PENALTY_AWARDED,
      ) || null;
    const penaltySaveIncident =
      turnOutcome.incidents.find(
        (incident) => incident.type === MatchActionOutcomeIncidentType.PENALTY_SAVE,
      ) || null;

    if (turnOutcome.isGoal) {
      const fallbackGoalKey =
        mode === MatchOutcomeNarrativeMode.LAST_PLAY
          ? turnOutcome.statTeamId === lastPlayAttackingTeamId
            ? 'match.lastPlay.attackGoal'
            : 'match.lastPlay.counterGoal'
          : turnOutcome.goalMessageKey ||
            (turnOutcome.statTeamId === match.teamId
              ? 'match.turn.userGoal'
              : 'match.turn.opponentGoal');
      const goalKey =
        mode === MatchOutcomeNarrativeMode.LAST_PLAY
          ? this.resolveLastPlayGoalKey({
              scorerTeamId: turnOutcome.statTeamId,
              userTeamId: match.teamId,
              isCounterGoal: fallbackGoalKey === 'match.lastPlay.counterGoal',
              fallbackGoalKey,
            })
          : this.resolveRegularGoalKey(turnOutcome.actionOutcome, fallbackGoalKey);
      const isOutcomeGoalKey = goalKey.startsWith('match.turn.result.outcome.SHOOT_');
      const goalParams = isOutcomeGoalKey
        ? {
            playerName: turnOutcome.statPlayerName,
            teamName: match.teamName,
            opponentTeamName: match.opponentName,
          }
        : {
            playerName: turnOutcome.statPlayerName,
            teamName: turnOutcome.statTeamName,
          };
      return {
        type: MatchMessageType.RESULT,
        key: goalKey,
        params: goalParams,
        metadata: {
          minute,
          turn,
          teamId: turnOutcome.statTeamId,
          teamName: turnOutcome.statTeamName,
          playerName: turnOutcome.statPlayerName,
        },
        timelineMessageEn: this.i18nService.t(goalKey, 'en', goalParams),
        incidentType: null,
      };
    }

    if (penaltyAwardedIncident) {
      const awardedTeamName = penaltyAwardedIncident.teamName || match.teamName;
      const awardedTeamId = penaltyAwardedIncident.teamId || match.teamId;
      const key = penaltyAwardedIncident.messageKey || 'match.penalty.foulWhistle';
      const paramsForKey = {
        teamName: awardedTeamName,
      };
      return {
        type: MatchMessageType.INFO,
        key,
        params: paramsForKey,
        metadata: {
          minute,
          turn,
          teamId: awardedTeamId,
          teamName: awardedTeamName,
          playerName: penaltyAwardedIncident.playerName || null,
        },
        timelineMessageEn: this.i18nService.t(key, 'en', paramsForKey),
        incidentType: MatchActionOutcomeIncidentType.PENALTY_AWARDED,
      };
    }

    if (penaltySaveIncident) {
      const defendingTeamName = penaltySaveIncident.teamName || match.opponentName;
      const goalkeeperName = penaltySaveIncident.playerName || turnOutcome.ballCarrierName;
      const key = penaltySaveIncident.messageKey || 'match.turn.penaltySaved';
      const paramsForKey = {
        goalkeeperName,
        teamName: defendingTeamName,
      };
      return {
        type: MatchMessageType.RESULT,
        key,
        params: paramsForKey,
        metadata: {
          minute,
          turn,
          teamId: penaltySaveIncident.teamId || null,
          teamName: defendingTeamName,
          playerName: goalkeeperName,
        },
        timelineMessageEn: this.i18nService.t(key, 'en', paramsForKey),
        incidentType: MatchActionOutcomeIncidentType.PENALTY_SAVE,
      };
    }

    const defaultResultKey = 'match.turn.result.outcome.NOT_HANDLED.1';
    const resultKey = this.matchNarrativeVariantHelper.resolveTurnResultKey(
      null,
      turnOutcome.actionOutcome,
      false,
      defaultResultKey,
    );
    const resultParamsByLocale = (locale: 'en' | 'es') => ({
      teamName: match.teamName,
      opponentTeamName: match.opponentName,
      actionLabel: this.actionLabel(
        action || MatchAction.ATTACK,
        locale,
        this.i18nService,
        undefined,
      ),
    });

    return {
      type: MatchMessageType.RESULT,
      key: resultKey,
      params: resultParamsByLocale,
      metadata: {
        minute,
        turn,
        teamId: match.teamId,
        teamName: match.teamName,
        playerName: turnOutcome.statPlayerName || null,
      },
      timelineMessageEn: this.i18nService.t(resultKey, 'en', resultParamsByLocale('en')),
      incidentType: null,
    };
  }

  resolveRestartMessage(params: ResolveRestartOutcomeMessageParams): MatchOutcomeMessageDescriptor {
    const {
      messageKey,
      minute,
      turn,
      teamId,
      teamName,
      playerName,
      messageParams,
      incidentType,
    } = params;
    const paramsForKey = this.resolveRestartParams(teamName, messageParams);

    return {
      type: MatchMessageType.RESTART,
      key: messageKey,
      params: paramsForKey,
      metadata: {
        minute,
        turn,
        teamId: teamId || null,
        teamName: teamName || null,
        playerName: playerName || null,
      },
      timelineMessageEn: this.i18nService.t(messageKey, 'en', paramsForKey),
      incidentType: incidentType || MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
    };
  }

  private resolveRestartParams(
    teamName: string | null | undefined,
    messageParams: TranslationParams | undefined,
  ): TranslationParams {
    if (messageParams && Object.keys(messageParams).length > 0) {
      return messageParams;
    }

    if (teamName) {
      return { teamName };
    }

    return {};
  }

  private resolveRegularGoalKey(
    actionOutcome: MatchActionOutcome,
    fallbackGoalKey: string,
  ): string {
    switch (actionOutcome) {
      case MatchActionOutcome.SHOOT_USER_GOAL:
      case MatchActionOutcome.SHOOT_OPPONENT_GOAL:
        return this.matchNarrativeVariantHelper.resolveTurnResultKey(
          null,
          actionOutcome,
          true,
          fallbackGoalKey,
        );
      default:
        return fallbackGoalKey;
    }
  }

  private resolveLastPlayGoalKey(params: {
    scorerTeamId: string | null;
    userTeamId: string;
    isCounterGoal: boolean;
    fallbackGoalKey: string;
  }): string {
    const { scorerTeamId, userTeamId, isCounterGoal, fallbackGoalKey } = params;
    const perspective = scorerTeamId === userTeamId ? 'for' : 'against';
    const base = isCounterGoal ? 'match.lastPlay.counterGoal' : 'match.lastPlay.attackGoal';
    const variantKey = `${base}.${perspective}.${this.randomInt(1, 5)}`;
    const enProbe = this.i18nService.t(variantKey, 'en');
    const esProbe = this.i18nService.t(variantKey, 'es');

    if (enProbe !== variantKey || esProbe !== variantKey) {
      return variantKey;
    }

    return fallbackGoalKey;
  }
}
