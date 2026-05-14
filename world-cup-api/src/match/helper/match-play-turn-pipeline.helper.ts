import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService, TranslationParams } from 'src/i18n/i18n.service';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { TeamsService } from 'src/teams/teams.service';
import { WorldCupService } from 'src/world-cup/world-cup.service';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../interfaces/match-localized-turn-message.interface';
import { MatchCurrentContext, TacticalSnapshot, TurnAdvanceResult, TurnContext } from '../interfaces/match-service.interfaces';
import {
  OpponentTacticalAdjustment,
} from '../interfaces/match-team-tactical-state.interface';
import { MatchPlayTurnPipelineContract } from '../interfaces/match-play-turn-pipeline.interface';
import { MatchEnginePreparePlayResult } from '../interfaces/match-engine.interface';
import { MatchPlayStageContext } from '../interfaces/match-play-stage.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchCoachTacticalPhase } from '../model/match-coach-tactical-phase.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchOption } from '../model/match-option.model';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchResult } from '../model/match-result.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import {
  DEFAULT_MATCH_LANGUAGE,
  FULL_TEAM_LINEUP_SIZE,
  HALF_TIME_VARIANT_COUNT,
  MIN_MESSAGES_PER_TURN,
} from '../model/match-engine.constants';
import { PlayRequest } from '../request/play.request';
import { MatchCoachTurnHelper } from './match-coach-turn.helper';
import { MatchDisciplineHelper } from './match-discipline.helper';
import { MatchFinalMessageHelper } from './match-final-message.helper';
import { MatchNarrativeHelper } from './match-narrative.helper';
import { MatchNarrativeVariantHelper } from './match-narrative-variant.helper';
import { MatchPersistenceHelper } from './match-persistence.helper';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { MatchResponseMapperHelper } from './match-response-mapper.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchTurnMessageHelper } from './match-turn-message.helper';
import { MatchTurnOptionsHelper } from './match-turn-options.helper';
import { MatchTurnOrchestratorHelper } from './match-turn-orchestrator.helper';
import { MatchActionOutcomeHelper } from './match-action-outcome.helper';
import { MatchTurnFlowHelper } from './match-turn-flow.helper';
import { MatchOpenPlayRestartHelper } from './match-open-play-restart.helper';
import { MatchPlayResponsePayload } from '../interfaces/match-play-response-payload.interface';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';
import {
  MatchActionOutcomeIncident,
  MatchActionOutcomeResult,
} from '../interfaces/match-action-outcome.interface';
import { MatchOutcomeMessageHelper } from './match-outcome-message.helper';
import { MatchOutcomeNarrativeMode } from '../interfaces/match-outcome-message.interface';

@Injectable()
export class MatchPlayTurnPipelineHelper
  extends AbstractMatchI18nHelper
  implements MatchPlayTurnPipelineContract
{
  private readonly actionsByEvent: Record<MatchEventType, MatchAction[]>;
  private readonly maxMessagesPerTurn: number;
  private readonly maxSubstitutionsPerTeam: number;
  private readonly opponentTacticsOnlySecondHalfEnabled: boolean;
  private readonly opponentTacticsCooldownTurns: number;
  private readonly opponentMaxStrategyChangesPerMatch: number;
  private readonly coachFormationStyleStrictness: number;

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    private readonly teamsService: TeamsService,
    private readonly i18nService: I18nService,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
    private readonly matchTurnOrchestratorHelper: MatchTurnOrchestratorHelper,
    private readonly matchActionOutcomeHelper: MatchActionOutcomeHelper,
    private readonly matchDisciplineHelper: MatchDisciplineHelper,
    private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper,
    private readonly matchTurnFlowHelper: MatchTurnFlowHelper,
    private readonly matchOpenPlayRestartHelper: MatchOpenPlayRestartHelper,
    private readonly matchOutcomeMessageHelper: MatchOutcomeMessageHelper,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchPersistenceHelper: MatchPersistenceHelper,
    private readonly matchFinalMessageHelper: MatchFinalMessageHelper,
    private readonly matchNarrativeVariantHelper: MatchNarrativeVariantHelper,
    private readonly matchCoachTurnHelper: MatchCoachTurnHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
    private readonly matchTurnMessageHelper: MatchTurnMessageHelper,
    private readonly matchTurnOptionsHelper: MatchTurnOptionsHelper,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly worldCupService: WorldCupService,
  ) {
    super();
    this.actionsByEvent = this.matchRuntimeConfigHelper.loadActionsByEvent();
    this.maxMessagesPerTurn = this.matchRuntimeConfigHelper.loadMaxMessagesPerTurn();
    this.maxSubstitutionsPerTeam = this.matchRuntimeConfigHelper.loadMaxSubstitutionsPerTeam();
    this.opponentTacticsOnlySecondHalfEnabled =
      this.matchRuntimeConfigHelper.loadOpponentTacticsOnlySecondHalfEnabled();
    this.opponentTacticsCooldownTurns = this.matchRuntimeConfigHelper.loadOpponentTacticsCooldownTurns();
    this.opponentMaxStrategyChangesPerMatch =
      this.matchRuntimeConfigHelper.loadOpponentMaxStrategyChangesPerMatch();
    this.coachFormationStyleStrictness = this.matchRuntimeConfigHelper.loadCoachFormationStyleStrictness();
  }
  async apply(context: MatchPlayStageContext): Promise<MatchPlayStageContext> {
    return await this.executeRegularTurn(context.request, context.preparedTurn);
  }

  private async executeRegularTurn(
    request: PlayRequest,
    preparedTurn: MatchEnginePreparePlayResult,
  ): Promise<MatchPlayStageContext> {
    const prepared = preparedTurn;
    const {
      language,
      match,
      currentStrategy,
      selectedOption,
      baseUserPlayers,
      baseOpponentPlayers,
      userPlayers,
      opponentPlayers,
      tacticalSnapshot,
      currentEventType,
      isExecutingRegularPenalty,
      userTacticalShift,
    } = prepared;

    const turnMessageAccumulator = this.matchTurnMessageHelper.createAccumulator(match);
    const turnMessages: LocalizedTurnMessages = turnMessageAccumulator.bundle;
    const turnMessageItems: LocalizedTurnMessageItem[] = turnMessageAccumulator.items;
    const pushTurnMessage = turnMessageAccumulator.pushTurnMessage;
    const pushPossessionConsequenceMessage = turnMessageAccumulator.pushPossessionConsequenceMessage;

    pushTurnMessage(
      MatchMessageType.PLAYER_ACTION,
      'match.turn.selectedAction',
      (locale) => ({
        actionLabel: this.actionLabel(selectedOption.action, locale, this.i18nService, undefined),
      }),
      {
        minute: match.minute,
        turn: match.turn,
        teamId: match.teamId,
        teamName: match.teamName,
      },
    );

    if (userTacticalShift) {
      const userTacticalShiftKey = this.resolveUserTacticalShiftMessageKey(
        userTacticalShift.strategy,
      );
      pushTurnMessage(
        MatchMessageType.INFO,
        userTacticalShiftKey,
        {
          teamName: match.teamName,
          coachName: match.teamCoachName || match.teamName,
          strategy: userTacticalShift.strategy,
          formation: userTacticalShift.formation,
          previousStrategy: userTacticalShift.previousStrategy,
          previousFormation: userTacticalShift.previousFormation,
        },
        {
          minute: match.minute,
          turn: match.turn,
          teamId: match.teamId,
          teamName: match.teamName,
        },
      );
    }

    if (selectedOption.action === MatchAction.RESTART_MATCH) {
      throw new BadRequestException(ApiErrorCode.INVALID_SELECTED_OPTION);
    }

    const definedTurn = await this.matchTurnFlowHelper.defineTurn({
      match,
      selectedAction: selectedOption.action,
      currentStrategy,
      currentEventType,
      isExecutingRegularPenalty,
      tacticalSnapshot,
      userPlayers,
      baseUserPlayers,
      opponentPlayers,
      baseOpponentPlayers,
    });
    const rawEventType = definedTurn.rawEventType;
    const possession = definedTurn.possession;
    const zone = definedTurn.zone;
    const turnAdvance: TurnAdvanceResult = definedTurn.turnAdvance;
    const turnContext: TurnContext = definedTurn.turnContext;
    const currentMatchContext: MatchCurrentContext = definedTurn.currentContext;
    const actingTeamId = turnContext.actingTeamId;
    const actingPlayer = turnContext.actingPlayer;
    const nextMinute = turnAdvance.nextMinute;
    let resolvedActionOutcome: MatchActionOutcome | null = null;
    this.matchTurnFlowHelper.applyTurnAdvance(match, turnAdvance, rawEventType);

    const contextMessageKey = this.resolveTurnContextKey(turnContext.action);
    pushTurnMessage(MatchMessageType.CONTEXT, contextMessageKey, (locale) => ({
      playerName: actingPlayer.name,
      teamName: turnContext.actingTeamName,
      zone: this.matchNarrativeHelper.describeZone(zone, locale),
    }), {
      minute: nextMinute,
      turn: match.turn,
      teamId: actingTeamId,
      teamName: turnContext.actingTeamName,
      playerName: actingPlayer.name,
    });

    let cardOutcome = this.matchDisciplineHelper.resolveCardOutcome(rawEventType);
    let cardHandled = false;

    if (cardOutcome) {
      const penalizedSide = this.matchDisciplineHelper.pickCardedSide(possession);
      const penalizedPlayers = penalizedSide === MatchPossession.USER ? userPlayers : opponentPlayers;
      const penalizedTeamId = penalizedSide === MatchPossession.USER ? match.teamId : match.opponentId;
      const penalizedTeamName = penalizedSide === MatchPossession.USER ? match.teamName : match.opponentName;
      const onFieldCount = (
        await this.matchSquadRulesHelper.getMatchOnFieldPlayers(match.matchId, penalizedTeamId)
      ).length;

      if (onFieldCount <= 7) {
        cardOutcome = null;
      }

      if (cardOutcome) {
        const sourcePlayers = penalizedPlayers.length
          ? penalizedPlayers
          : penalizedSide === MatchPossession.USER
            ? baseUserPlayers
            : baseOpponentPlayers;
        const cardedPlayer = this.matchDisciplineHelper.pickCardedPlayer(sourcePlayers, zone, rawEventType);

        switch (cardOutcome) {
          case MatchCardType.RED: {
            const removed = await this.matchSquadRulesHelper.applyRedCardToSquadPlayer(
              match.matchId,
              penalizedTeamId,
              cardedPlayer.playerId,
            );
            if (removed) {
              this.matchDisciplineHelper.applyRedCardPenalty(match, penalizedSide, cardedPlayer.position);
              break;
            }

            cardOutcome = await this.matchSquadRulesHelper.applyYellowCardToSquadPlayer(
              match.matchId,
              penalizedTeamId,
              cardedPlayer.playerId,
            );
            if (cardOutcome === MatchCardType.RED) {
              this.matchDisciplineHelper.applyRedCardPenalty(match, penalizedSide, cardedPlayer.position);
            }
            break;
          }
          default:
            cardOutcome = await this.matchSquadRulesHelper.applyYellowCardToSquadPlayer(
              match.matchId,
              penalizedTeamId,
              cardedPlayer.playerId,
            );
            if (cardOutcome === MatchCardType.RED) {
              this.matchDisciplineHelper.applyRedCardPenalty(match, penalizedSide, cardedPlayer.position);
            }
            break;
        }

        const cardEventType = this.resolveCardEventType(cardOutcome);
        const cardMessage = this.resolveCardMessageMeta(cardOutcome);
        pushTurnMessage(
          cardMessage.type,
          cardMessage.key,
          (locale) => ({
            playerName: cardedPlayer.name,
            teamName: penalizedTeamName,
            zone: this.matchNarrativeHelper.describeZone(zone, locale),
          }),
          {
            minute: nextMinute,
            turn: match.turn,
            teamId: penalizedTeamId,
            teamName: penalizedTeamName,
            playerName: cardedPlayer.name,
          },
        );

        await this.recordMatchStat({
          matchId: match.matchId,
          minute: nextMinute,
          turn: match.turn,
          eventType: cardEventType,
          zone,
          action: selectedOption.action,
          teamId: penalizedTeamId,
          teamName: penalizedTeamName,
          playerName: cardedPlayer.name,
          playerPosition: cardedPlayer.position,
          cardType: cardOutcome,
          isGoal: false,
          message: turnMessages.en[turnMessages.en.length - 1],
        });

        const beneficiarySide =
          penalizedSide === MatchPossession.USER ? MatchPossession.OPPONENT : MatchPossession.USER;
        const beneficiaryTeamId = beneficiarySide === MatchPossession.USER ? match.teamId : match.opponentId;
        const beneficiaryTeamName = beneficiarySide === MatchPossession.USER ? match.teamName : match.opponentName;
        const beneficiaryPlayers = beneficiarySide === MatchPossession.USER ? userPlayers : opponentPlayers;
        const fallbackBeneficiaryPlayers =
          beneficiarySide === MatchPossession.USER ? baseUserPlayers : baseOpponentPlayers;
        const restartEventType = this.matchOpenPlayRestartHelper.resolveRestartEventByZone(
          zone,
          beneficiarySide,
        );
        const restartDescriptor = this.matchTurnOrchestratorHelper.resolveCardRestartDescriptor(
          restartEventType,
          zone,
        );
        const restartPlayer = this.pickPlayerForAction(
          beneficiaryPlayers.length ? beneficiaryPlayers : fallbackBeneficiaryPlayers,
          restartDescriptor.action,
          restartDescriptor.zone,
        );

        match.eventType = restartEventType;
        match.possessionTeam = beneficiarySide;
        match.ballCarrierTeamId = beneficiaryTeamId;
        match.ballCarrierName = restartPlayer.name;
        match.currentZone = restartDescriptor.zone;

        const restartMessageTeamName =
          restartDescriptor.messageKey === 'match.restart.penaltyFor' ||
          restartDescriptor.messageKey === 'match.restart.penaltyAgainst'
            ? match.teamName
            : beneficiaryTeamName;
        pushTurnMessage(MatchMessageType.RESTART, restartDescriptor.messageKey, { teamName: restartMessageTeamName }, {
          minute: nextMinute,
          turn: match.turn,
          teamId: beneficiaryTeamId,
          teamName: beneficiaryTeamName,
          playerName: restartPlayer.name,
        });

        await this.recordMatchStat({
          matchId: match.matchId,
          minute: nextMinute,
          turn: match.turn,
          eventType: restartEventType,
          zone: restartDescriptor.zone,
          action: null,
          teamId: beneficiaryTeamId,
          teamName: beneficiaryTeamName,
          playerName: restartPlayer.name,
          playerPosition: restartPlayer.position,
          cardType: null,
          isGoal: false,
          message: turnMessages.en[turnMessages.en.length - 1],
          messageKey: restartDescriptor.messageKey,
          messageParams: {
            teamName: restartMessageTeamName,
          },
        });
        pushPossessionConsequenceMessage(
          possession,
          (match.possessionTeam as MatchPossession) || possession,
          nextMinute,
          match.turn,
        );

        cardHandled = true;
      }
    }

    if (cardOutcome && !cardHandled) {
      const fallbackEvent = this.resolveFallbackEventForPossession(possession);
      match.eventType = fallbackEvent;
      turnContext.eventType = fallbackEvent;
    }

    if (!cardHandled) {
      const turnOutcome = this.matchActionOutcomeHelper.resolveActionOutcome({
        match,
        context: turnContext,
        currentContext: currentMatchContext,
        tactical: tacticalSnapshot,
        userPlayers: userPlayers.length ? userPlayers : baseUserPlayers,
        opponentPlayers: opponentPlayers.length ? opponentPlayers : baseOpponentPlayers,
        baseUserPlayers,
        baseOpponentPlayers,
        actionsByEvent: this.actionsByEvent,
        isExecutingRegularPenalty,
      });
      resolvedActionOutcome = turnOutcome.actionOutcome;

      if (turnOutcome.isGoal) {
        const rivalryApplied = await this.applyRivalryMoraleSwing(match, turnOutcome.statTeamId);
        if (rivalryApplied) {
          pushTurnMessage(MatchMessageType.INFO, 'match.rivalry.momentum');
        }
      }

      match.scoreTeam = turnOutcome.scoreTeam;
      match.scoreOpponent = turnOutcome.scoreOpponent;
      match.ballCarrierTeamId = turnOutcome.ballCarrierTeamId;
      match.ballCarrierName = turnOutcome.ballCarrierName;
      const outcomeDescriptor = this.matchOutcomeMessageHelper.resolveOutcomeMessage({
        match,
        turnOutcome,
        action: turnContext.action,
        minute: nextMinute,
        turn: match.turn,
        mode: this.isLastPlayEvent(rawEventType)
          ? MatchOutcomeNarrativeMode.LAST_PLAY
          : MatchOutcomeNarrativeMode.REGULAR,
        lastPlayAttackingTeamId: this.isLastPlayEvent(rawEventType)
          ? this.isLastPlayForEvent(rawEventType)
            ? match.teamId
            : match.opponentId
          : null,
      });
      pushTurnMessage(
        outcomeDescriptor.type,
        outcomeDescriptor.key,
        outcomeDescriptor.params,
        outcomeDescriptor.metadata,
      );
      const outcomeTimelineMessage = outcomeDescriptor.timelineMessageEn;

      await this.recordMatchStat({
        matchId: match.matchId,
        minute: nextMinute,
        turn: match.turn,
        eventType: rawEventType,
        zone: turnContext.zone,
        action: turnOutcome.statAction,
        teamId: turnOutcome.statTeamId,
        teamName: turnOutcome.statTeamName,
        playerName: turnOutcome.statPlayerName,
        playerPosition: turnOutcome.statPlayerPosition,
        cardType: null,
        isGoal: turnOutcome.isGoal,
        message: outcomeTimelineMessage,
      });

      if (turnOutcome.isGoal) {
        const restartSide =
          turnOutcome.statTeamId === match.teamId ? MatchPossession.OPPONENT : MatchPossession.USER;
        const restartTeamId = restartSide === MatchPossession.USER ? match.teamId : match.opponentId;
        const restartTeamName = restartSide === MatchPossession.USER ? match.teamName : match.opponentName;
        const restartPlayers =
          restartSide === MatchPossession.USER
            ? userPlayers.length
              ? userPlayers
              : baseUserPlayers
            : opponentPlayers.length
              ? opponentPlayers
              : baseOpponentPlayers;
        const restartPlayer = this.pickPlayerForAction(
          restartPlayers,
          MatchAction.PASS,
          MatchFieldZone.MIDFIELD,
        );

        match.eventType = MatchEventType.KICKOFF_EVENT;
        match.possessionTeam = restartSide;
        match.currentZone = MatchFieldZone.MIDFIELD;
        match.ballCarrierTeamId = restartTeamId;
        match.ballCarrierName = restartPlayer.name;

        pushTurnMessage(MatchMessageType.RESTART, 'match.restart.kickoff', { teamName: restartTeamName }, {
          minute: nextMinute,
          turn: match.turn,
          teamId: restartTeamId,
          teamName: restartTeamName,
          playerName: restartPlayer.name,
        });

        await this.recordMatchStat({
          matchId: match.matchId,
          minute: nextMinute,
          turn: match.turn,
          eventType: MatchEventType.KICKOFF_EVENT,
          zone: MatchFieldZone.MIDFIELD,
          action: MatchAction.PASS,
          teamId: restartTeamId,
          teamName: restartTeamName,
          playerName: restartPlayer.name,
          playerPosition: restartPlayer.position,
          cardType: null,
          isGoal: false,
          message: turnMessages.en[turnMessages.en.length - 1],
          messageKey: 'match.restart.kickoff',
          messageParams: {
            teamName: restartTeamName,
          },
        });
      } else {
        const openPlayRestartIncident = this.findActionOutcomeIncident(
          turnOutcome.incidents,
          MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
        );
        if (openPlayRestartIncident) {
          await this.applyOpenPlayRestartFromIncident({
            incident: openPlayRestartIncident,
            match,
            nextMinute,
            pushTurnMessage,
            userPlayers,
            baseUserPlayers,
            opponentPlayers,
            baseOpponentPlayers,
          });
        } else {
          this.applyOutcomeTransition({
            match,
            turnOutcome,
            userPlayers,
            baseUserPlayers,
            opponentPlayers,
            baseOpponentPlayers,
          });
        }
      }

      pushPossessionConsequenceMessage(
        possession,
        (match.possessionTeam as MatchPossession) || possession,
        nextMinute,
        match.turn,
      );
    }

    const responsePayload: MatchPlayResponsePayload = {
      match,
      language,
      tacticalSnapshot,
      userPlayers: userPlayers.length ? userPlayers : baseUserPlayers,
      opponentPlayers: opponentPlayers.length ? opponentPlayers : baseOpponentPlayers,
      selectedAction: selectedOption.action,
      actionOutcome: resolvedActionOutcome,
      turnMessages,
      turnMessageItems,
      currentContext: {
        ...currentMatchContext,
        isPendingSetPiece: this.isRegularPenaltyEvent(match.eventType as MatchEventType),
      },
    };

    return {
      request,
      preparedTurn: prepared,
      selectedAction: selectedOption.action,
      postTurnPayload: {
        match,
        nextMinute,
        actingPlayer,
        language,
        selectedAction: selectedOption.action,
        resolvedActionOutcome,
        turnMessages,
        turnMessageItems,
        baseUserPlayers,
        baseOpponentPlayers,
        userPlayers,
        opponentPlayers,
        tacticalSnapshot,
        currentContext: responsePayload.currentContext,
        pushTurnMessage,
        shouldEnterHalfTime: (currentMatch) => this.shouldEnterHalfTime(currentMatch),
        isLastPlayEvent: (eventType) => this.isLastPlayEvent(eventType),
        maybeApplyOpponentTacticalAdjustment: async (currentMatch, params) =>
          this.maybeApplyOpponentTacticalAdjustment(currentMatch, params),
        resolveHalfTimeSummaryKey: (currentMatch) => this.resolveHalfTimeSummaryKey(currentMatch),
        resolveHalfTimeVariantKey: () => this.resolveHalfTimeVariantKey(),
        recordMatchStat: async (statParams) => this.recordMatchStat(statParams),
        prepareLastPlayTurn: async (lastPlayParams) => this.prepareLastPlayTurn(lastPlayParams),
        closeMatchAtNinety: async (currentMatch, refreshedUserPlayers, refreshedOpponentPlayers) =>
          this.closeMatchAtNinety(currentMatch, refreshedUserPlayers, refreshedOpponentPlayers),
        buildFinalMessageLocalized: (currentMatch, currentLanguage) =>
          this.buildFinalMessageLocalized(currentMatch, currentLanguage),
      },
      responsePayload,
    };
  }

  private pickPlayerForAction(players: TeamPlayer[], action: MatchAction, zone: MatchFieldZone): TeamPlayer {
    return this.matchPlayerSelectionHelper.pickPlayerForAction(players, action, zone);
  }

  private pickGoalkeeperForScenario(players: TeamPlayer[]): TeamPlayer {
    const explicitGoalkeeper = players.find((player) => player.position === 'GK');
    if (explicitGoalkeeper) {
      return explicitGoalkeeper;
    }

    return this.pickPlayerForAction(players, MatchAction.DIVE_LEFT, MatchFieldZone.BOX);
  }

  private async resolveGoalkeeperForTeam(
    teamId: string,
    onFieldPlayers: TeamPlayer[],
  ): Promise<TeamPlayer> {
    const onFieldGoalkeeper = onFieldPlayers.find((player) => player.position === 'GK');
    if (onFieldGoalkeeper) {
      return onFieldGoalkeeper;
    }

    try {
      const fullRoster = await this.teamsService.getTeamPlayers(teamId);
      const rosterGoalkeeper = fullRoster.find((player) => player.position === 'GK');
      if (rosterGoalkeeper) {
        return rosterGoalkeeper;
      }
    } catch {
      // Fallback below keeps flow resilient even if roster fetch fails.
    }

    return this.pickGoalkeeperForScenario(onFieldPlayers);
  }

  /**
   * Returns true for regular-turn penalty events.
   */
  private isRegularPenaltyEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.PENALTY_FOR_EVENT:
      case MatchEventType.PENALTY_AGAINST_EVENT:
        return true;
      default:
        return false;
    }
  }

  private resolveCardEventType(cardType: MatchCardType): MatchEventType {
    switch (cardType) {
      case MatchCardType.RED:
        return MatchEventType.RED_CARD_EVENT;
      default:
        return MatchEventType.YELLOW_CARD_EVENT;
    }
  }

  private resolveCardMessageMeta(cardType: MatchCardType): {
    type: MatchMessageType.YELLOW_CARD | MatchMessageType.RED_CARD;
    key: 'match.card.yellow' | 'match.card.red';
  } {
    switch (cardType) {
      case MatchCardType.RED:
        return { type: MatchMessageType.RED_CARD, key: 'match.card.red' };
      default:
        return { type: MatchMessageType.YELLOW_CARD, key: 'match.card.yellow' };
    }
  }

  private resolveFallbackEventForPossession(possession: MatchPossession): MatchEventType {
    switch (possession) {
      case MatchPossession.USER:
        return MatchEventType.BALL_POSSESSION_EVENT;
      default:
        return MatchEventType.DEFENSE_EVENT;
    }
  }

  private applyOutcomeTransition(params: {
    match: MatchEntity;
    turnOutcome: MatchActionOutcomeResult;
    userPlayers: TeamPlayer[];
    baseUserPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
    baseOpponentPlayers: TeamPlayer[];
  }): void {
    const {
      match,
      turnOutcome,
      userPlayers,
      baseUserPlayers,
      opponentPlayers,
      baseOpponentPlayers,
    } = params;
    const nextPossession = turnOutcome.nextPossession;
    const nextZone = turnOutcome.nextZone;
    const nextEventType = turnOutcome.nextEventType;

    match.eventType = nextEventType;
    match.possessionTeam = nextPossession;
    match.currentZone = nextZone;

    const expectedBallCarrierTeamId =
      nextPossession === MatchPossession.USER ? match.teamId : match.opponentId;
    const carrierPool =
      nextPossession === MatchPossession.USER
        ? (userPlayers.length ? userPlayers : baseUserPlayers)
        : (opponentPlayers.length ? opponentPlayers : baseOpponentPlayers);
    const outcomeCarrierById = turnOutcome.actingPlayer
      ? carrierPool.find((player) => player.playerId === turnOutcome.actingPlayer.playerId)
      : null;
    const outcomeCarrierByName = turnOutcome.ballCarrierName
      ? carrierPool.find((player) => player.name === turnOutcome.ballCarrierName)
      : null;
    const fallbackCarrier = carrierPool.length
      ? this.pickPlayerForAction(carrierPool, MatchAction.PASS, nextZone)
      : null;
    const resolvedCarrier = outcomeCarrierById || outcomeCarrierByName || fallbackCarrier;

    match.ballCarrierTeamId = expectedBallCarrierTeamId;
    if (resolvedCarrier) {
      match.ballCarrierName = resolvedCarrier.name;
    }
  }

  private findActionOutcomeIncident(
    incidents: MatchActionOutcomeIncident[] | undefined,
    type: MatchActionOutcomeIncidentType,
  ): MatchActionOutcomeIncident | null {
    if (!incidents || incidents.length === 0) {
      return null;
    }

    return incidents.find((incident) => incident.type === type) || null;
  }

  private async applyOpenPlayRestartFromIncident(params: {
    incident: MatchActionOutcomeIncident;
    match: MatchEntity;
    nextMinute: number;
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
    userPlayers: TeamPlayer[];
    baseUserPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
    baseOpponentPlayers: TeamPlayer[];
  }): Promise<void> {
    const {
      incident,
      match,
      nextMinute,
      pushTurnMessage,
      userPlayers,
      baseUserPlayers,
      opponentPlayers,
      baseOpponentPlayers,
    } = params;

    const restartEventType = incident.eventType || MatchEventType.FREE_KICK_FOR_EVENT;
    const fallbackRestartSide = this.matchOpenPlayRestartHelper.resolvePossessionFromRestartEvent(restartEventType);
    const restartSide =
      incident.possession === MatchPossession.USER || incident.possession === MatchPossession.OPPONENT
        ? incident.possession
        : fallbackRestartSide;
    const restartTeamId = restartSide === MatchPossession.USER ? match.teamId : match.opponentId;
    const restartTeamName = restartSide === MatchPossession.USER ? match.teamName : match.opponentName;
    const restartPlayers =
      restartSide === MatchPossession.USER
        ? userPlayers.length
          ? userPlayers
          : baseUserPlayers
        : opponentPlayers.length
          ? opponentPlayers
          : baseOpponentPlayers;
    const fallbackZone = (match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD;
    const fallbackDescriptor = this.matchTurnOrchestratorHelper.resolveOpenPlayRestartDescriptor(
      restartEventType,
      fallbackZone,
    );
    const restartAction = incident.action || fallbackDescriptor.action;
    const restartZone = incident.zone || fallbackDescriptor.zone;
    const restartMessageKey = incident.messageKey || fallbackDescriptor.messageKey;
    const restartPlayer = this.pickPlayerForAction(
      restartPlayers,
      restartAction,
      restartZone,
    );

    match.eventType = restartEventType;
    match.possessionTeam = restartSide;
    match.currentZone = restartZone;
    match.ballCarrierTeamId = restartTeamId;
    match.ballCarrierName = restartPlayer.name;
    const restartMessageParams = incident.messageParams || { teamName: restartTeamName };

    const restartDescriptor = this.matchOutcomeMessageHelper.resolveRestartMessage({
      messageKey: restartMessageKey,
      minute: nextMinute,
      turn: match.turn,
      teamId: restartTeamId,
      teamName: restartTeamName,
      playerName: restartPlayer.name,
      messageParams: restartMessageParams,
      incidentType: MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
    });

    pushTurnMessage(
      restartDescriptor.type,
      restartDescriptor.key,
      restartDescriptor.params,
      restartDescriptor.metadata,
    );

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: nextMinute,
      turn: match.turn,
      eventType: restartEventType,
      zone: restartZone,
      action: null,
      teamId: restartTeamId,
      teamName: restartTeamName,
      playerName: restartPlayer.name,
      playerPosition: restartPlayer.position,
      cardType: null,
      isGoal: false,
      message: restartDescriptor.timelineMessageEn,
      messageKey: restartDescriptor.key,
      messageParams: restartMessageParams,
    });
  }

  /**
   * Closes match at 90 minutes and enforces a winner if the score is tied.
   * Also logs decisive final event into match_stats.
   */
  private async closeMatchAtNinety(
    match: MatchEntity,
    userPlayers: TeamPlayer[],
    opponentPlayers: TeamPlayer[],
  ): Promise<void> {
    match.isFinished = true;
    match.isActive = false;
    match.minute = 90;
    match.turn = match.maxTurns;
    match.eventType = MatchEventType.END;

    if (match.scoreTeam === match.scoreOpponent) {
      const tacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
        strategy: match.strategy,
        formation: match.formation,
        opponentStrategy: match.opponentStrategy,
        opponentFormation: match.opponentFormation,
      });
      const userAdvantage =
        0.5 +
        match.opponentDefensePenalty * 0.04 +
        match.opponentMidfieldPenalty * 0.02 -
        match.teamDefensePenalty * 0.04 -
        match.teamMidfieldPenalty * 0.02 +
        tacticalSnapshot.opponentPenaltyPoints * 0.01 -
        tacticalSnapshot.teamPenaltyPoints * 0.01;

      const userWins = this.chance(Math.min(0.8, Math.max(0.2, userAdvantage)));

      if (userWins) {
        const scorer = this.pickPlayerForAction(userPlayers, MatchAction.SHOOT, MatchFieldZone.BOX);
        match.scoreTeam += 1;
        match.ballCarrierTeamId = match.teamId;
        match.ballCarrierName = scorer.name;
        match.message = this.i18nService.t('match.close.decisiveUserGoal', 'en', {
          playerName: scorer.name,
          teamName: match.teamName,
          finalMessage: this.buildFinalMessageLocalized(match, 'en'),
        });

        await this.recordMatchStat({
          matchId: match.matchId,
          minute: 90,
          turn: match.turn,
          eventType: MatchEventType.END,
          zone: MatchFieldZone.BOX,
          action: MatchAction.SHOOT,
          teamId: match.teamId,
          teamName: match.teamName,
          playerName: scorer.name,
          playerPosition: scorer.position,
          cardType: null,
          isGoal: true,
          message: this.i18nService.t('match.close.decidesAt90', 'en', { playerName: scorer.name }),
        });
      } else {
        const scorer = this.pickPlayerForAction(opponentPlayers, MatchAction.SHOOT, MatchFieldZone.BOX);
        match.scoreOpponent += 1;
        match.ballCarrierTeamId = match.opponentId;
        match.ballCarrierName = scorer.name;
        match.message = this.i18nService.t('match.close.decisiveOpponentGoal', 'en', {
          playerName: scorer.name,
          teamName: match.opponentName,
          finalMessage: this.buildFinalMessageLocalized(match, 'en'),
        });

        await this.recordMatchStat({
          matchId: match.matchId,
          minute: 90,
          turn: match.turn,
          eventType: MatchEventType.END,
          zone: MatchFieldZone.BOX,
          action: MatchAction.SHOOT,
          teamId: match.opponentId,
          teamName: match.opponentName,
          playerName: scorer.name,
          playerPosition: scorer.position,
          cardType: null,
          isGoal: true,
          message: this.i18nService.t('match.close.decidesAt90', 'en', { playerName: scorer.name }),
        });
      }
    } else {
      match.message = this.buildFinalMessageLocalized(match, 'en');
    }
  }

  /**
   * When rivals play each other, a goal shifts morale for the next turn only.
   */
  private async applyRivalryMoraleSwing(match: MatchEntity, scoringTeamId: string): Promise<boolean> {
    const isRivalry = await this.teamsService.areTeamsRivals(match.teamId, match.opponentId);
    if (!isRivalry) {
      return false;
    }

    if (scoringTeamId === match.teamId) {
      match.teamMoraleBoostTurns = 2;
      match.teamMoralePenaltyTurns = 0;
      match.opponentMoraleBoostTurns = 0;
      match.opponentMoralePenaltyTurns = 2;
      return true;
    }

    if (scoringTeamId === match.opponentId) {
      match.teamMoraleBoostTurns = 0;
      match.teamMoralePenaltyTurns = 2;
      match.opponentMoraleBoostTurns = 2;
      match.opponentMoralePenaltyTurns = 0;
      return true;
    }

    return false;
  }

  /**
   * Consumes one turn of active morale effects.
   */
  private decayMoraleEffects(match: MatchEntity): void {
    match.teamMoraleBoostTurns = Math.max(0, match.teamMoraleBoostTurns - 1);
    match.teamMoralePenaltyTurns = Math.max(0, match.teamMoralePenaltyTurns - 1);
    match.opponentMoraleBoostTurns = Math.max(0, match.opponentMoraleBoostTurns - 1);
    match.opponentMoralePenaltyTurns = Math.max(0, match.opponentMoralePenaltyTurns - 1);
  }

  /**
   * Prepares one decisive "last play" state when regular interactions end in a draw.
   * The event does not consume an additional turn beyond the configured max turns.
   */
  private async prepareLastPlayTurn(params: {
    match: MatchEntity;
    language: MatchLanguage;
    turnMessages: LocalizedTurnMessages;
    turnMessageItems: LocalizedTurnMessageItem[];
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
  }): Promise<void> {
    const { match, turnMessages, turnMessageItems, userPlayers, opponentPlayers } = params;
    const eventType = this.pickLastPlayEventType();
    const attackingSide = this.isLastPlayForEvent(eventType)
      ? MatchPossession.USER
      : MatchPossession.OPPONENT;
    const attackingPlayers = attackingSide === MatchPossession.USER ? userPlayers : opponentPlayers;
    const defendingPlayers = attackingSide === MatchPossession.USER ? opponentPlayers : userPlayers;
    const attackingTeamId = attackingSide === MatchPossession.USER ? match.teamId : match.opponentId;
    const attackingTeamName = attackingSide === MatchPossession.USER ? match.teamName : match.opponentName;
    const defendingTeamId = attackingSide === MatchPossession.USER ? match.opponentId : match.teamId;
    const defaultAttackingAction = this.isLastPlayPenaltyEvent(eventType)
      ? MatchAction.LEFT
      : MatchAction.SHOOT;
    const attacker = this.pickPlayerForAction(attackingPlayers, defaultAttackingAction, MatchFieldZone.BOX);
    const goalkeeper = await this.resolveGoalkeeperForTeam(defendingTeamId, defendingPlayers);
    const scenarioKey = this.resolveLastPlayScenarioKey(eventType);
    const scenarioParams = {
      attackerName: attacker.name,
      goalkeeperName: goalkeeper.name,
      attackingTeamName,
    };

    const tensionEn = this.i18nService.t('match.lastPlay.tension', 'en');
    const tensionEs = this.i18nService.t('match.lastPlay.tension', 'es');
    const scenarioEn = this.i18nService.t(scenarioKey, 'en', scenarioParams);
    const scenarioEs = this.i18nService.t(scenarioKey, 'es', scenarioParams);

    turnMessages.en.push(tensionEn);
    turnMessages.es.push(tensionEs);
    turnMessages.en.push(scenarioEn);
    turnMessages.es.push(scenarioEs);
    turnMessageItems.push(
      {
        type: MatchMessageType.LAST_PLAY,
        en: tensionEn,
        es: tensionEs,
        minute: 90,
        turn: match.maxTurns,
        teamId: null,
        teamName: null,
      },
      {
        type: MatchMessageType.LAST_PLAY,
        en: scenarioEn,
        es: scenarioEs,
        minute: 90,
        turn: match.maxTurns,
        teamId: attackingTeamId,
        teamName: attackingTeamName,
        playerName: attacker.name,
      },
    );

    match.minute = 90;
    match.turn = match.maxTurns;
    match.eventType = eventType;
    match.currentZone = MatchFieldZone.BOX;
    match.possessionTeam = attackingSide;
    match.ballCarrierTeamId = attackingTeamId;
    match.ballCarrierName = attacker.name;
    match.message = turnMessages.en[0];

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType,
      zone: MatchFieldZone.BOX,
      action: null,
      teamId: attackingTeamId,
      teamName: attackingTeamName,
      playerName: attacker.name,
      playerPosition: attacker.position,
      cardType: null,
      isGoal: false,
      message: this.i18nService.t(scenarioKey, 'en', scenarioParams),
    });

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType,
      zone: MatchFieldZone.BOX,
      action: null,
      teamId: defendingTeamId,
      teamName: attackingSide === MatchPossession.USER ? match.opponentName : match.teamName,
      playerName: goalkeeper.name,
      playerPosition: goalkeeper.position,
      cardType: null,
      isGoal: false,
      message: this.i18nService.t('match.lastPlay.tension', 'en'),
    });
  }

  /**
   * Chooses one of four possible last-play scenarios:
   * one-on-one or penalty, each one FOR/AGAINST the user team.
   */
  private pickLastPlayEventType(): MatchEventType {
    const pool: MatchEventType[] = [
      MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT,
      MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT,
      MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT,
      MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT,
    ];

    return pool[this.randomInt(0, pool.length - 1)];
  }

  /**
   * Returns true when event means "user attacking in the final action".
   */
  private isLastPlayForEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
        return true;
      default:
        return false;
    }
  }

  /**
   * Returns true when event belongs to the last-play family.
   */
  private isLastPlayEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        return true;
      default:
        return false;
    }
  }

  /**
   * Returns true when the match is currently paused in halftime.
   */
  private isHalfTimeEvent(eventType: MatchEventType): boolean {
    return eventType === MatchEventType.HALF_TIME_EVENT;
  }

  /**
   * Triggers halftime exactly once when first-half turns are completed.
   */
  private shouldEnterHalfTime(match: MatchEntity): boolean {
    const playedTurns = Math.max(0, match.turn - 1);
    const halfTurns = Math.floor(match.maxTurns / 2);

    return (
      !match.isFinished &&
      !this.isHalfTimeEvent(match.eventType as MatchEventType) &&
      !this.isLastPlayEvent(match.eventType as MatchEventType) &&
      playedTurns === halfTurns &&
      match.minute < 46
    );
  }

  /**
   * Selects halftime summary line according to current score.
   */
  private resolveHalfTimeSummaryKey(
    match: MatchEntity,
  ): 'match.halftime.summary.leading' | 'match.halftime.summary.drawing' | 'match.halftime.summary.trailing' {
    if (match.scoreTeam > match.scoreOpponent) {
      return 'match.halftime.summary.leading';
    }

    if (match.scoreTeam < match.scoreOpponent) {
      return 'match.halftime.summary.trailing';
    }

    return 'match.halftime.summary.drawing';
  }

  /**
   * Picks one halftime commentary variant key.
   */
  private resolveHalfTimeVariantKey(): string {
    const variantIndex = this.randomInt(1, HALF_TIME_VARIANT_COUNT);
    return `match.halftime.variant.${variantIndex}`;
  }

  /**
   * Applies AI tactical switch for opponent with a hard cap of 3 changes per match.
   * Triggered at halftime and near the endgame.
   */
  private async maybeApplyOpponentTacticalAdjustment(
    match: MatchEntity,
    params: {
      phase: MatchCoachTacticalPhase;
      minute: number;
      eventType: MatchEventType;
    },
  ): Promise<OpponentTacticalAdjustment | null> {
    return this.matchCoachTurnHelper.maybeApplyOpponentTacticalAdjustment({
      match,
      params,
      runtimeConfig: {
        opponentTacticsOnlySecondHalfEnabled: this.opponentTacticsOnlySecondHalfEnabled,
        opponentTacticsCooldownTurns: this.opponentTacticsCooldownTurns,
        opponentMaxStrategyChangesPerMatch: this.opponentMaxStrategyChangesPerMatch,
        coachFormationStyleStrictness: this.coachFormationStyleStrictness,
      },
    });
  }

  /**
   * Picks a compatible formation for a strategy, preferring current shape when compatible.
   * When a switch is required, it blends coach style and tactical context:
   * - style weight = COACH_FORMATION_STYLE_STRICTNESS / 10
   * - context weight = 1 - style weight
   */
  private resolveFormationForStrategy(
    strategy: MatchStrategy,
    currentFormationValue: string | null,
    coachProfile: CoachProfile | null = null,
  ): MatchFormation {
    return this.matchCoachTurnHelper.resolveFormationForStrategy({
      strategy,
      currentFormationValue,
      coachProfile,
      coachFormationStyleStrictness: this.coachFormationStyleStrictness,
    });
  }

  /**
   * Checks whether a strategy and formation pair is compatible.
   */
  private isStrategyFormationCompatible(
    strategy: MatchStrategy,
    formation: MatchFormation | null,
  ): boolean {
    return this.matchCoachTurnHelper.isStrategyFormationCompatible({ strategy, formation });
  }

  /**
   * Identifies penalty flavor for last-play scenario text and action profiles.
   */
  private isLastPlayPenaltyEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        return true;
      default:
        return false;
    }
  }

  /**
   * Resolves one localized last-play scenario key with explicit perspective
   * (for/against) and randomized variant.
   */
  private resolveLastPlayScenarioKey(eventType: MatchEventType): string {
    const baseKey = this.resolveLastPlayScenarioBaseKey(eventType);
    const variantKey = `${baseKey}.${this.randomInt(1, 5)}`;
    const enProbe = this.i18nService.t(variantKey, 'en');
    const esProbe = this.i18nService.t(variantKey, 'es');

    if (enProbe !== variantKey || esProbe !== variantKey) {
      return variantKey;
    }

    return this.resolveLastPlayLegacyScenarioKey(eventType);
  }

  private resolveLastPlayScenarioBaseKey(eventType: MatchEventType): string {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
        return 'match.lastPlay.penalty.for';
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        return 'match.lastPlay.penalty.against';
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
        return 'match.lastPlay.oneOnOne.for';
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT:
      default:
        return 'match.lastPlay.oneOnOne.against';
    }
  }

  private resolveLastPlayLegacyScenarioKey(eventType: MatchEventType): string {
    return this.isLastPlayPenaltyEvent(eventType) ? 'match.lastPlay.penalty' : 'match.lastPlay.oneOnOne';
  }

  /**
   * Builds localized final whistle narrative using deterministic variants.
   * Messages are selected from epic (user win) or sad (opponent win) templates.
   */
  private buildFinalMessageLocalized(match: MatchEntity, language: MatchLanguage): string {
    return this.matchFinalMessageHelper.buildFinalMessageLocalized(match, language);
  }

  private async recordMatchTurnContext(params: {
    matchId: string;
    turn: number;
    minute: number;
    phase: 'START' | 'TURN' | 'END';
    selectedAction: MatchAction | null;
    actionOutcome: MatchActionOutcome | null;
    headline: string | null;
    context: MatchCurrentContext;
  }): Promise<void> {
    await this.matchPersistenceHelper.recordMatchTurnContext(params);
  }

  /**
   * Appends one timeline event row into match_stats table.
   */
  private async recordMatchStat(params: {
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
    messageParams?: TranslationParams | null;
  }): Promise<void> {
    await this.matchPersistenceHelper.recordMatchStat(params);
  }

  /**
   * Resolves a context narration key based on the action with variant fallback.
   */
  private resolveTurnContextKey(action: MatchAction): string {
    return this.matchNarrativeVariantHelper.resolveTurnContextKey(action);
  }

  private resolveUserTacticalShiftMessageKey(strategy: MatchStrategy): string {
    const variantKey = `match.tactics.userShift.${strategy}.${this.randomInt(1, 2)}`;
    const variantExists =
      this.i18nService.t(variantKey, 'en') !== variantKey &&
      this.i18nService.t(variantKey, 'es') !== variantKey;
    return variantExists ? variantKey : 'match.tactics.userShift';
  }

}
