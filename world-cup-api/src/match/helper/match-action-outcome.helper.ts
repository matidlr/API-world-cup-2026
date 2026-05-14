import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import {
  MatchActionOutcomeIncident,
  MatchActionOutcomeHelperContract,
  MatchActionOutcomeResult,
  ResolveMatchActionOutcomeParams,
} from '../interfaces/match-action-outcome.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { DEFENSIVE_ACTIONS, GOALKEEPER_ACTIONS } from '../model/match-action-group.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchDuelResult } from '../interfaces/match-duel.interface';
import { MatchDuelHelper } from './match-duel.helper';
import { MatchGoalScorerHelper } from './match-goal-scorer.helper';
import { MatchNarrativeHelper } from './match-narrative.helper';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { MatchProbabilityHelper } from './match-probability.helper';
import { MatchTurnOptionsHelper } from './match-turn-options.helper';
import { MatchActionTransitionHelper } from './match-action-transition.helper';
import { MatchOpenPlayRestartHelper } from './match-open-play-restart.helper';
import { MatchTurnOrchestratorHelper } from './match-turn-orchestrator.helper';
import { MatchPenaltyResolutionHelper } from './match-penalty-resolution.helper';
import { TurnContext } from '../interfaces/match-turn-context.interface';

@Injectable()
/**
 * Resolves the heavy ACTION -> DUEL -> OUTCOME branch for one turn.
 */
export class MatchActionOutcomeHelper implements MatchActionOutcomeHelperContract {
  constructor(
    private readonly i18nService: I18nService,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
    private readonly matchDuelHelper: MatchDuelHelper,
    private readonly matchProbabilityHelper: MatchProbabilityHelper,
    private readonly matchGoalScorerHelper: MatchGoalScorerHelper,
    private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper,
    private readonly matchTurnOptionsHelper: MatchTurnOptionsHelper,
    private readonly matchActionTransitionHelper: MatchActionTransitionHelper,
    private readonly matchOpenPlayRestartHelper: MatchOpenPlayRestartHelper,
    private readonly matchTurnOrchestratorHelper: MatchTurnOrchestratorHelper,
    private readonly matchPenaltyResolutionHelper: MatchPenaltyResolutionHelper,
  ) {}

  resolveActionOutcome(params: ResolveMatchActionOutcomeParams): MatchActionOutcomeResult {
    let scoreTeam = params.match.scoreTeam;
    let scoreOpponent = params.match.scoreOpponent;
    const contextualUserPlayers = this.resolveContextualPlayersBySide(
      MatchPossession.USER,
      params.currentContext,
      params.userPlayers,
      params.opponentPlayers,
    );
    const contextualOpponentPlayers = this.resolveContextualPlayersBySide(
      MatchPossession.OPPONENT,
      params.currentContext,
      params.userPlayers,
      params.opponentPlayers,
    );

    if (this.isLastPlayEvent(params.context.eventType)) {
      return this.resolveLastPlayOutcome({
        params,
        scoreTeam,
        scoreOpponent,
        contextualUserPlayers,
        contextualOpponentPlayers,
      });
    }

    if (this.isPenaltyEvent(params.context.eventType) && !params.isExecutingRegularPenalty) {
      const penaltyAward = this.matchPenaltyResolutionHelper.resolvePenaltyAwardIncident({
        eventType: params.context.eventType,
        match: params.match,
        userPlayers: params.userPlayers,
        opponentPlayers: params.opponentPlayers,
        baseUserPlayers: params.baseUserPlayers,
        baseOpponentPlayers: params.baseOpponentPlayers,
      });

      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.penalty.foulWhistle', 'en', {
          teamName: penaltyAward.awardedTeamName,
        }),
        isGoal: false,
        goalMessageKey: null,
        statTeamId: penaltyAward.awardedTeamId,
        statTeamName: penaltyAward.awardedTeamName,
        statPlayerName: penaltyAward.designatedPenaltyTaker.name,
        statPlayerPosition: penaltyAward.designatedPenaltyTaker.position,
        statAction: params.context.action,
        ballCarrierTeamId: penaltyAward.awardedTeamId,
        ballCarrierName: penaltyAward.designatedPenaltyTaker.name,
        nextPossession: penaltyAward.awardedSide,
        nextZone: MatchFieldZone.BOX,
        nextEventType: params.context.eventType,
        actingPlayer: penaltyAward.designatedPenaltyTaker,
        actionOutcome: MatchActionOutcome.NOT_HANDLED,
        incidents: [penaltyAward.incident],
      });
    }

    if (params.context.eventType === MatchEventType.PENALTY_FOR_EVENT) {
      const didScore = this.matchProbabilityHelper.resolveTeamGoalChance(
        params.match,
        params.context,
        params.tactical,
        {
          attackingPlayers: contextualUserPlayers,
          defendingPlayers: contextualOpponentPlayers,
        },
      );

      if (didScore) {
        const scorer = this.matchGoalScorerHelper.pickScorerForGoal({
          players: params.userPlayers,
          fallbackPlayer: params.context.actingPlayer,
          action: params.context.action,
          zone: MatchFieldZone.BOX,
        });
        scoreTeam += 1;
        return this.buildOutcome(params, {
          scoreTeam,
          scoreOpponent,
          message: this.i18nService.t('match.outcome.userGoalFromZone', 'en', {
            playerName: scorer.name,
            teamName: params.match.teamName,
            zone: this.matchNarrativeHelper.describeZone(MatchFieldZone.BOX, 'en'),
          }),
          isGoal: true,
          goalMessageKey: 'match.turn.userGoal',
          statTeamId: params.match.teamId,
          statTeamName: params.match.teamName,
          statPlayerName: scorer.name,
          statPlayerPosition: scorer.position,
          statAction: params.context.action,
          ballCarrierTeamId: params.match.teamId,
          ballCarrierName: scorer.name,
          nextPossession: MatchPossession.USER,
          actionOutcome: MatchActionOutcome.SHOOT_USER_GOAL,
        });
      }

      const penaltySave = this.matchPenaltyResolutionHelper.resolvePenaltySaveIncident({
        eventType: MatchEventType.PENALTY_FOR_EVENT,
        match: params.match,
        userPlayers: params.userPlayers,
        opponentPlayers: params.opponentPlayers,
        baseUserPlayers: params.baseUserPlayers,
        baseOpponentPlayers: params.baseOpponentPlayers,
      });
      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
          playerName: params.context.actingPlayer.name,
          zone: this.matchNarrativeHelper.describeZone(MatchFieldZone.BOX, 'en'),
        }),
        isGoal: false,
        goalMessageKey: null,
        statTeamId: params.match.teamId,
        statTeamName: params.match.teamName,
        statPlayerName: params.context.actingPlayer.name,
        statPlayerPosition: params.context.actingPlayer.position,
        statAction: params.context.action,
        ballCarrierTeamId: params.match.teamId,
        ballCarrierName: params.context.actingPlayer.name,
        nextPossession: MatchPossession.USER,
        incidents: [penaltySave.incident],
      });
    }

    if (params.context.eventType === MatchEventType.PENALTY_AGAINST_EVENT) {
      const opponentPenaltyShooter = this.matchPlayerSelectionHelper.pickPlayerForAction(
        contextualOpponentPlayers,
        MatchAction.SHOOT,
        MatchFieldZone.BOX,
      );
      const didOpponentScore = this.matchProbabilityHelper.resolveOpponentGoalChance(
        params.match,
        params.context,
        params.tactical,
        {
          attackingPlayers: contextualOpponentPlayers,
          defendingPlayers: contextualUserPlayers,
          attackingPlayer: opponentPenaltyShooter,
        },
      );

      if (didOpponentScore) {
        const opponentScorer = this.matchGoalScorerHelper.pickScorerForGoal({
          players: params.opponentPlayers,
          fallbackPlayer: opponentPenaltyShooter,
          action: MatchAction.SHOOT,
          zone: MatchFieldZone.BOX,
        });
        scoreOpponent += 1;
        return this.buildOutcome(params, {
          scoreTeam,
          scoreOpponent,
          message: this.i18nService.t('match.outcome.opponentGoalFromZone', 'en', {
            playerName: opponentScorer.name,
            teamName: params.match.opponentName,
            zone: this.matchNarrativeHelper.describeZone(MatchFieldZone.BOX, 'en'),
          }),
          isGoal: true,
          goalMessageKey: 'match.turn.opponentGoal',
          statTeamId: params.match.opponentId,
          statTeamName: params.match.opponentName,
          statPlayerName: opponentScorer.name,
          statPlayerPosition: opponentScorer.position,
          statAction: MatchAction.SHOOT,
          ballCarrierTeamId: params.match.opponentId,
          ballCarrierName: opponentScorer.name,
          nextPossession: MatchPossession.OPPONENT,
          actionOutcome: MatchActionOutcome.SHOOT_OPPONENT_GOAL,
        });
      }

      const penaltySave = this.matchPenaltyResolutionHelper.resolvePenaltySaveIncident({
        eventType: MatchEventType.PENALTY_AGAINST_EVENT,
        match: params.match,
        userPlayers: params.userPlayers,
        opponentPlayers: params.opponentPlayers,
        baseUserPlayers: params.baseUserPlayers,
        baseOpponentPlayers: params.baseOpponentPlayers,
      });
      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.outcome.opponentNoGoal', 'en', {
          playerName: opponentPenaltyShooter.name,
          teamName: params.match.opponentName,
        }),
        isGoal: false,
        goalMessageKey: null,
        statTeamId: params.match.opponentId,
        statTeamName: params.match.opponentName,
        statPlayerName: opponentPenaltyShooter.name,
        statPlayerPosition: opponentPenaltyShooter.position,
        statAction: MatchAction.SHOOT,
        ballCarrierTeamId: params.match.opponentId,
        ballCarrierName: opponentPenaltyShooter.name,
        nextPossession: MatchPossession.OPPONENT,
        incidents: [penaltySave.incident],
      });
    }

    const opponentAction = this.matchTurnOptionsHelper.pickOpponentAction({
      eventType: params.context.eventType,
      possession: params.context.possession,
      actionsByEvent: params.actionsByEvent,
    });
    const opponentActor = this.matchPlayerSelectionHelper.pickPlayerForAction(
      contextualOpponentPlayers,
      opponentAction,
      params.context.zone,
    );

    if (params.context.possession === MatchPossession.USER) {
      const shouldResolveDuel =
        params.context.action === MatchAction.PASS ||
        params.context.action === MatchAction.LONG_PASS ||
        params.context.action === MatchAction.DRIBBLE ||
        params.context.action === MatchAction.SHOOT;

      if (shouldResolveDuel) {
        const duelResult = this.matchDuelHelper.resolveDuel({
          context: params.currentContext,
          action: params.context.action,
        });

        if (duelResult.handled) {
          if (params.context.action === MatchAction.SHOOT) {
            if (duelResult.outcome === MatchActionOutcome.SHOOT_MISSED) {
              const missBallCarrierTeamId =
                duelResult.nextPossession === MatchPossession.USER
                  ? params.match.teamId
                  : params.match.opponentId;
              const missResolvedCarrier = this.resolveDuelCarrier({
                duelResult,
                context: params.context,
                userPlayers: params.userPlayers,
                opponentPlayers: params.opponentPlayers,
              });

              return this.buildOutcome(params, {
                scoreTeam,
                scoreOpponent,
                message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
                  playerName: params.context.actingPlayer.name,
                  zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
                }),
                isGoal: false,
                goalMessageKey: null,
                statTeamId: params.match.teamId,
                statTeamName: params.match.teamName,
                statPlayerName: params.context.actingPlayer.name,
                statPlayerPosition: params.context.actingPlayer.position,
                statAction: params.context.action,
                ballCarrierTeamId: missBallCarrierTeamId,
                ballCarrierName: missResolvedCarrier.name,
                nextPossession: duelResult.nextPossession,
                nextZone: duelResult.nextZone,
                actionOutcome: MatchActionOutcome.SHOOT_MISSED,
              });
            }

            const didScore = this.matchProbabilityHelper.resolveTeamGoalChance(
              params.match,
              params.context,
              params.tactical,
              {
                attackingPlayers: contextualUserPlayers,
                defendingPlayers: contextualOpponentPlayers,
              },
            );

            if (didScore) {
              scoreTeam += 1;
              return this.buildOutcome(params, {
                scoreTeam,
                scoreOpponent,
                message: this.i18nService.t('match.outcome.userGoalFromZone', 'en', {
                  playerName: params.context.actingPlayer.name,
                  teamName: params.match.teamName,
                  zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
                }),
                isGoal: true,
                goalMessageKey: 'match.turn.userGoal',
                statTeamId: params.match.teamId,
                statTeamName: params.match.teamName,
                statPlayerName: params.context.actingPlayer.name,
                statPlayerPosition: params.context.actingPlayer.position,
                statAction: params.context.action,
                ballCarrierTeamId: params.match.teamId,
                ballCarrierName: params.context.actingPlayer.name,
                nextPossession: MatchPossession.USER,
                nextZone: duelResult.nextZone,
                actionOutcome: MatchActionOutcome.SHOOT_USER_GOAL,
              });
            }

            const duelBallCarrierTeamId =
              duelResult.nextPossession === MatchPossession.USER
                ? params.match.teamId
                : params.match.opponentId;
            const duelResolvedCarrier = this.resolveDuelCarrier({
              duelResult,
              context: params.context,
              userPlayers: params.userPlayers,
              opponentPlayers: params.opponentPlayers,
            });

            return this.buildOutcome(params, {
              scoreTeam,
              scoreOpponent,
              message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
                playerName: params.context.actingPlayer.name,
                zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
              }),
              isGoal: false,
              goalMessageKey: null,
              statTeamId: params.match.teamId,
              statTeamName: params.match.teamName,
              statPlayerName: params.context.actingPlayer.name,
              statPlayerPosition: params.context.actingPlayer.position,
              statAction: params.context.action,
              ballCarrierTeamId: duelBallCarrierTeamId,
              ballCarrierName: duelResolvedCarrier.name,
              nextPossession: duelResult.nextPossession,
              nextZone: duelResult.nextZone,
              actionOutcome: duelResult.outcome,
            });
          }

          const duelBallCarrierTeamId =
            duelResult.nextPossession === MatchPossession.USER ? params.match.teamId : params.match.opponentId;
          const duelResolvedCarrier = this.resolveDuelCarrier({
            duelResult,
            context: params.context,
            userPlayers: params.userPlayers,
            opponentPlayers: params.opponentPlayers,
          });

          return this.buildOutcome(params, {
            scoreTeam,
            scoreOpponent,
            message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
              playerName: params.context.actingPlayer.name,
              zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
            }),
            isGoal: false,
            goalMessageKey: null,
            statTeamId: params.match.teamId,
            statTeamName: params.match.teamName,
            statPlayerName: params.context.actingPlayer.name,
            statPlayerPosition: params.context.actingPlayer.position,
            statAction: params.context.action,
            ballCarrierTeamId: duelBallCarrierTeamId,
            ballCarrierName: duelResolvedCarrier.name,
            nextPossession: duelResult.nextPossession,
            nextZone: duelResult.nextZone,
            actionOutcome: duelResult.outcome,
          });
        }
      }

      const didScore = this.matchProbabilityHelper.resolveTeamGoalChance(
        params.match,
        params.context,
        params.tactical,
        {
          attackingPlayers: contextualUserPlayers,
          defendingPlayers: contextualOpponentPlayers,
        },
      );

      if (didScore) {
        const scorer = this.matchGoalScorerHelper.pickScorerForGoal({
          players: params.userPlayers,
          fallbackPlayer: params.context.actingPlayer,
          action: params.context.action,
          zone: params.context.zone,
        });
        scoreTeam += 1;
        return this.buildOutcome(params, {
          scoreTeam,
          scoreOpponent,
          message: this.i18nService.t('match.outcome.userGoalFromZone', 'en', {
            playerName: scorer.name,
            teamName: params.match.teamName,
            zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
          }),
          isGoal: true,
          goalMessageKey: 'match.turn.userGoal',
          statTeamId: params.match.teamId,
          statTeamName: params.match.teamName,
          statPlayerName: scorer.name,
          statPlayerPosition: scorer.position,
          statAction: params.context.action,
          ballCarrierTeamId: params.match.teamId,
          ballCarrierName: scorer.name,
          nextPossession: MatchPossession.USER,
          actionOutcome: MatchActionOutcome.SHOOT_USER_GOAL,
        });
      }

      if (this.shouldResolveReboundPossessionAfterShot(params.context)) {
        const reboundPossession = this.matchProbabilityHelper.resolvePostMissedShotPossession(
          params.context,
          params.tactical,
          {
            attackingPlayers: contextualUserPlayers,
            defendingPlayers: contextualOpponentPlayers,
            attackingPlayer: params.context.actingPlayer,
            defendingPlayer: opponentActor,
          },
        );
        const reboundCarrier =
          reboundPossession === MatchPossession.USER
            ? params.context.actingPlayer
            : opponentActor;
        const reboundCarrierTeamId =
          reboundPossession === MatchPossession.USER ? params.match.teamId : params.match.opponentId;

        return this.buildOutcome(params, {
          scoreTeam,
          scoreOpponent,
          message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
            playerName: params.context.actingPlayer.name,
            zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
          }),
          isGoal: false,
          goalMessageKey: null,
          statTeamId: params.match.teamId,
          statTeamName: params.match.teamName,
          statPlayerName: params.context.actingPlayer.name,
          statPlayerPosition: params.context.actingPlayer.position,
          statAction: params.context.action,
          ballCarrierTeamId: reboundCarrierTeamId,
          ballCarrierName: reboundCarrier.name,
          nextPossession: reboundPossession,
        });
      }

      if (this.shouldAllowImmediateOpponentGoal(params.context)) {
        const opponentThreat = this.matchProbabilityHelper.resolveOpponentGoalChance(
          params.match,
          params.context,
          params.tactical,
          {
            attackingPlayers: contextualOpponentPlayers,
            defendingPlayers: contextualUserPlayers,
            attackingPlayer: opponentActor,
          },
          this.resolveOpponentTransitionChanceMultiplier(params.context.action),
        );
        if (opponentThreat) {
          const opponentScorer = this.matchGoalScorerHelper.pickScorerForGoal({
            players: params.opponentPlayers,
            fallbackPlayer: opponentActor,
            action: opponentAction,
            zone: params.context.zone,
          });
          scoreOpponent += 1;
          const isTransitionCounter = this.isTransitionCounterGoalContext(params.context);
          const messageKey = isTransitionCounter
            ? 'match.outcome.opponentCounter'
            : 'match.outcome.opponentGoalFromZone';
          const goalMessageKey = isTransitionCounter
            ? 'match.turn.opponentCounterGoal'
            : 'match.turn.opponentGoal';

          return this.buildOutcome(params, {
            scoreTeam,
            scoreOpponent,
            message: this.i18nService.t(messageKey, 'en', {
              playerName: opponentScorer.name,
              teamName: params.match.opponentName,
              zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
            }),
            isGoal: true,
            goalMessageKey,
            statTeamId: params.match.opponentId,
            statTeamName: params.match.opponentName,
            statPlayerName: opponentScorer.name,
            statPlayerPosition: opponentScorer.position,
            statAction: opponentAction,
            ballCarrierTeamId: params.match.opponentId,
            ballCarrierName: opponentScorer.name,
            nextPossession: MatchPossession.OPPONENT,
            actionOutcome: MatchActionOutcome.SHOOT_OPPONENT_GOAL,
          });
        }
      }

      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.outcome.userNoGoal', 'en', {
          playerName: params.context.actingPlayer.name,
          zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
        }),
        isGoal: false,
        goalMessageKey: null,
        statTeamId: params.match.teamId,
        statTeamName: params.match.teamName,
        statPlayerName: params.context.actingPlayer.name,
        statPlayerPosition: params.context.actingPlayer.position,
        statAction: params.context.action,
        ballCarrierTeamId: params.match.teamId,
        ballCarrierName: params.context.actingPlayer.name,
        nextPossession: MatchPossession.USER,
        actionOutcome: this.resolveNonDuelUserOutcome(params.context.action),
      });
    }

    const opponentScores = this.matchProbabilityHelper.resolveOpponentGoalChance(
      params.match,
      params.context,
      params.tactical,
      {
        attackingPlayers: contextualOpponentPlayers,
        defendingPlayers: contextualUserPlayers,
        attackingPlayer: opponentActor,
      },
    );

    if (opponentScores) {
      const scorer = this.matchGoalScorerHelper.pickScorerForGoal({
        players: params.opponentPlayers,
        fallbackPlayer: opponentActor,
        action: opponentAction,
        zone: params.context.zone,
      });
      scoreOpponent += 1;

      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.outcome.opponentGoalFromZone', 'en', {
          playerName: scorer.name,
          teamName: params.match.opponentName,
          zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
        }),
        isGoal: true,
        goalMessageKey: 'match.turn.opponentGoal',
        statTeamId: params.match.opponentId,
        statTeamName: params.match.opponentName,
        statPlayerName: scorer.name,
        statPlayerPosition: scorer.position,
        statAction: opponentAction,
        ballCarrierTeamId: params.match.opponentId,
        ballCarrierName: scorer.name,
        nextPossession: MatchPossession.OPPONENT,
        actionOutcome: MatchActionOutcome.SHOOT_OPPONENT_GOAL,
      });
    }

    const defensiveRecovery = this.shouldAttemptDefensiveRecovery(params.context)
      ? this.matchProbabilityHelper.resolveDefensiveRecoveryChance(
        params.match,
        params.context,
        params.tactical,
        {
          recoveringPlayers: contextualUserPlayers,
          possessingPlayers: contextualOpponentPlayers,
        },
      )
      : false;

    if (defensiveRecovery) {
      const recoveredCarrier = this.pickRecoveredCarrierAfterDefensiveRecovery({
        context: params.context,
        contextualUserPlayers,
        fallbackUserPlayers: params.userPlayers,
      });

      if (this.shouldAttemptImmediateCounterAfterRecovery(params.context)) {
        const counterChance = this.matchProbabilityHelper.resolveCounterChance(
          params.match,
          params.context,
          params.tactical,
          {
            attackingPlayers: contextualUserPlayers,
            defendingPlayers: contextualOpponentPlayers,
          },
        );

        if (counterChance) {
          const userScorer = this.matchGoalScorerHelper.pickScorerForGoal({
            players: params.userPlayers,
            fallbackPlayer: this.matchPlayerSelectionHelper.pickPlayerForAction(
              params.userPlayers,
              MatchAction.SHOOT,
              MatchFieldZone.ATTACK_THIRD,
            ),
            action: MatchAction.SHOOT,
            zone: MatchFieldZone.ATTACK_THIRD,
          });
          scoreTeam += 1;
          const isUserCounterGoal = this.shouldMarkUserCounterGoal(params.context);
          const messageKey = isUserCounterGoal ? 'match.outcome.userCounterGoal' : 'match.outcome.userGoalFromZone';
          const goalMessageKey = isUserCounterGoal ? 'match.turn.userCounterGoal' : 'match.turn.userGoal';

          return this.buildOutcome(params, {
            scoreTeam,
            scoreOpponent,
            message: this.i18nService.t(messageKey, 'en', {
              playerName: userScorer.name,
              teamName: params.match.teamName,
              zone: this.matchNarrativeHelper.describeZone(params.context.zone, 'en'),
            }),
            isGoal: true,
            goalMessageKey,
            statTeamId: params.match.teamId,
            statTeamName: params.match.teamName,
            statPlayerName: userScorer.name,
            statPlayerPosition: userScorer.position,
            statAction: MatchAction.SHOOT,
            ballCarrierTeamId: params.match.teamId,
            ballCarrierName: userScorer.name,
            nextPossession: MatchPossession.USER,
            actionOutcome: MatchActionOutcome.SHOOT_USER_GOAL,
          });
        }
      }

      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.outcome.opponentNoGoal', 'en', {
          playerName: opponentActor.name,
          teamName: params.match.opponentName,
        }),
        isGoal: false,
        goalMessageKey: null,
        statTeamId: params.match.teamId,
        statTeamName: params.match.teamName,
        statPlayerName: recoveredCarrier.name,
        statPlayerPosition: recoveredCarrier.position,
        statAction: params.context.action,
        ballCarrierTeamId: params.match.teamId,
        ballCarrierName: recoveredCarrier.name,
        nextPossession: MatchPossession.USER,
        actionOutcome: this.resolveNonDuelDefensiveOutcome(params.context.action, true),
      });
    }

    return this.buildOutcome(params, {
      scoreTeam,
      scoreOpponent,
      message: this.i18nService.t('match.outcome.opponentNoGoal', 'en', {
        playerName: params.context.actingPlayer.name,
        teamName: params.match.opponentName,
      }),
      isGoal: false,
      goalMessageKey: null,
      statTeamId: params.match.opponentId,
      statTeamName: params.match.opponentName,
      statPlayerName: opponentActor.name,
      statPlayerPosition: opponentActor.position,
      statAction: opponentAction,
      ballCarrierTeamId: params.match.opponentId,
      ballCarrierName: opponentActor.name,
      nextPossession: MatchPossession.OPPONENT,
      actionOutcome: this.resolveNonDuelDefensiveOutcome(params.context.action, false),
    });
  }

  private buildOutcome(
    params: ResolveMatchActionOutcomeParams,
    rawOutcome: Omit<
      MatchActionOutcomeResult,
      'actionOutcome' | 'nextZone' | 'nextEventType' | 'actingPlayer' | 'incidents'
    > &
      Partial<
        Pick<
          MatchActionOutcomeResult,
          'actionOutcome' | 'nextZone' | 'nextEventType' | 'actingPlayer' | 'incidents'
        >
      >,
  ): MatchActionOutcomeResult {
    const resolvedActionOutcome = rawOutcome.actionOutcome ?? MatchActionOutcome.NOT_HANDLED;
    const transition = this.matchActionTransitionHelper.resolveTransition({
      context: params.currentContext,
      action: params.context.action,
      actionOutcome: resolvedActionOutcome,
    });

    const resolvedNextZone = rawOutcome.nextZone ?? transition.nextZone;
    const resolvedNextEventType =
      rawOutcome.nextEventType ??
      this.resolveOutcomeEventType({
        currentEventType: params.context.eventType,
        isGoal: rawOutcome.isGoal,
        nextPossession: rawOutcome.nextPossession,
        transitionEventType: transition.nextEventType,
      });

    const resolvedActingPlayer =
      rawOutcome.actingPlayer ??
      this.resolveOutcomeActingPlayer({
        params,
        rawOutcome,
        fallbackActingPlayer: transition.nextActingPlayer,
      });
    const mergedIncidents = [...(rawOutcome.incidents ?? [])];
    const postOutcomeTurnContext = this.buildPostOutcomeTurnContext({
      params,
      nextPossession: rawOutcome.nextPossession,
      nextZone: resolvedNextZone,
      nextEventType: resolvedNextEventType,
      actingPlayer: resolvedActingPlayer,
    });
    const openPlayRestartIncident = this.resolveOpenPlayRestartIncident({
      params,
      isGoal: rawOutcome.isGoal,
      postOutcomeTurnContext,
    });
    if (openPlayRestartIncident) {
      mergedIncidents.push(openPlayRestartIncident);
    }

    return {
      ...rawOutcome,
      actionOutcome: resolvedActionOutcome,
      nextZone: resolvedNextZone,
      nextEventType: resolvedNextEventType,
      actingPlayer: resolvedActingPlayer,
      incidents: mergedIncidents,
    };
  }

  private resolveOutcomeActingPlayer(params: {
    params: ResolveMatchActionOutcomeParams;
    rawOutcome: Pick<
      MatchActionOutcomeResult,
      'nextPossession' | 'ballCarrierTeamId' | 'ballCarrierName'
    > & {
      nextZone?: MatchFieldZone;
    };
    fallbackActingPlayer: TeamPlayer;
  }): TeamPlayer {
    const { params: source, rawOutcome, fallbackActingPlayer } = params;
    const sideRoster =
      rawOutcome.nextPossession === MatchPossession.USER
        ? source.userPlayers.length
          ? source.userPlayers
          : source.currentContext.teammatesInZone
        : source.opponentPlayers.length
          ? source.opponentPlayers
          : source.currentContext.opponentsInZone;

    if (sideRoster.length > 0) {
      const byName = sideRoster.find((player) => player.name === rawOutcome.ballCarrierName);
      if (byName) {
        return byName;
      }

      return this.matchPlayerSelectionHelper.pickPlayerForAction(
        sideRoster,
        rawOutcome.nextPossession === MatchPossession.USER ? MatchAction.PASS : MatchAction.DEFEND,
        rawOutcome.nextZone ?? source.currentContext.zone,
      );
    }

    return fallbackActingPlayer || source.currentContext.actingPlayer;
  }

  private resolveOutcomeEventType(params: {
    currentEventType: MatchEventType;
    isGoal: boolean;
    nextPossession: MatchPossession;
    transitionEventType: MatchEventType;
  }): MatchEventType {
    const { currentEventType, isGoal, nextPossession, transitionEventType } = params;

    if (isGoal) {
      return MatchEventType.KICKOFF_EVENT;
    }

    if (this.isSetPieceEvent(currentEventType)) {
      return nextPossession === MatchPossession.USER
        ? MatchEventType.BALL_POSSESSION_EVENT
        : MatchEventType.DEFENSE_EVENT;
    }

    return transitionEventType;
  }

  private isSetPieceEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.PENALTY_FOR_EVENT:
      case MatchEventType.PENALTY_AGAINST_EVENT:
      case MatchEventType.FREE_KICK_FOR_EVENT:
      case MatchEventType.FREE_KICK_AGAINST_EVENT:
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.CORNER_AGAINST_EVENT:
      case MatchEventType.THROW_IN_FOR_EVENT:
      case MatchEventType.THROW_IN_AGAINST_EVENT:
        return true;
      default:
        return false;
    }
  }

  private isPenaltyEvent(eventType: MatchEventType): eventType is
    | MatchEventType.PENALTY_FOR_EVENT
    | MatchEventType.PENALTY_AGAINST_EVENT {
    return (
      eventType === MatchEventType.PENALTY_FOR_EVENT ||
      eventType === MatchEventType.PENALTY_AGAINST_EVENT
    );
  }

  private resolveOpenPlayRestartIncident(
    params: {
      params: ResolveMatchActionOutcomeParams;
      isGoal: boolean;
      postOutcomeTurnContext: TurnContext;
    },
  ): MatchActionOutcomeIncident | null {
    const { params: source, isGoal, postOutcomeTurnContext } = params;

    if (
      this.isLastPlayEvent(source.context.eventType) ||
      this.isSetPieceEvent(source.context.eventType)
    ) {
      return null;
    }

    const restartEventType = this.matchOpenPlayRestartHelper.resolveOpenPlayRestartEvent(
      postOutcomeTurnContext,
      isGoal,
    );
    if (!restartEventType) {
      return null;
    }

    const restartSide = this.matchOpenPlayRestartHelper.resolvePossessionFromRestartEvent(restartEventType);
    const restartTeamId = restartSide === MatchPossession.USER ? source.match.teamId : source.match.opponentId;
    const restartTeamName =
      restartSide === MatchPossession.USER ? source.match.teamName : source.match.opponentName;
    const restartDescriptor = this.matchTurnOrchestratorHelper.resolveOpenPlayRestartDescriptor(
      restartEventType,
      postOutcomeTurnContext.zone,
    );

    return {
      type: MatchActionOutcomeIncidentType.OPEN_PLAY_RESTART,
      eventType: restartEventType,
      zone: restartDescriptor.zone,
      possession: restartSide,
      teamId: restartTeamId,
      teamName: restartTeamName,
      action: restartDescriptor.action,
      messageKey: restartDescriptor.messageKey,
      messageParams: {
        teamName: restartTeamName,
      },
    };
  }

  private buildPostOutcomeTurnContext(params: {
    params: ResolveMatchActionOutcomeParams;
    nextPossession: MatchPossession;
    nextZone: MatchFieldZone;
    nextEventType: MatchEventType;
    actingPlayer: TeamPlayer;
  }): TurnContext {
    const { params: source, nextPossession, nextZone, nextEventType, actingPlayer } = params;
    const actingTeamId = nextPossession === MatchPossession.USER ? source.match.teamId : source.match.opponentId;
    const actingTeamName =
      nextPossession === MatchPossession.USER ? source.match.teamName : source.match.opponentName;

    return {
      action: source.context.action,
      eventType: nextEventType,
      possession: nextPossession,
      zone: nextZone,
      actingTeamId,
      actingTeamName,
      actingPlayer,
    };
  }

  private resolveDuelCarrier(params: {
    duelResult: MatchDuelResult;
    context: ResolveMatchActionOutcomeParams['context'];
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
  }): TeamPlayer {
    const { duelResult, context, userPlayers, opponentPlayers } = params;
    const sourcePlayers =
      duelResult.nextPossession === MatchPossession.USER ? userPlayers : opponentPlayers;
    const resolvedCarrier = duelResult.toPlayer;
    const hasValidIdentity = Boolean(resolvedCarrier?.playerId && resolvedCarrier?.name);

    if (hasValidIdentity) {
      return resolvedCarrier;
    }

    if (sourcePlayers.length === 0) {
      return context.actingPlayer;
    }

    return this.matchPlayerSelectionHelper.pickPlayerForAction(
      sourcePlayers,
      context.action,
      duelResult.nextZone,
    );
  }

  private resolveContextualPlayersBySide(
    side: MatchPossession,
    context: ResolveMatchActionOutcomeParams['currentContext'],
    userPlayers: TeamPlayer[],
    opponentPlayers: TeamPlayer[],
  ): TeamPlayer[] {
    const contextualPlayers =
      side === MatchPossession.USER
        ? context.possession === MatchPossession.USER
          ? context.teammatesInZone
          : context.opponentsInZone
        : context.possession === MatchPossession.OPPONENT
          ? context.teammatesInZone
          : context.opponentsInZone;

    if (contextualPlayers.length > 0) {
      return contextualPlayers;
    }

    return side === MatchPossession.USER ? userPlayers : opponentPlayers;
  }

  private shouldResolveReboundPossessionAfterShot(context: ResolveMatchActionOutcomeParams['context']): boolean {
    return context.possession === MatchPossession.USER && context.action === MatchAction.SHOOT;
  }

  private shouldAllowImmediateOpponentGoal(context: ResolveMatchActionOutcomeParams['context']): boolean {
    if (context.possession !== MatchPossession.USER) {
      return true;
    }

    if (context.action === MatchAction.SHOOT) {
      return false;
    }

    if (DEFENSIVE_ACTIONS.has(context.action) || GOALKEEPER_ACTIONS.has(context.action)) {
      return false;
    }

    const riskyTransitionActions = new Set<MatchAction>([
      MatchAction.LONG_PASS,
      MatchAction.DRIBBLE,
      MatchAction.ATTACK,
      MatchAction.CROSS,
    ]);

    if (!riskyTransitionActions.has(context.action)) {
      return false;
    }

    return (
      context.eventType === MatchEventType.BALL_POSSESSION_EVENT ||
      context.eventType === MatchEventType.ATTACK_EVENT
    );
  }

  private shouldAttemptDefensiveRecovery(context: ResolveMatchActionOutcomeParams['context']): boolean {
    if (context.possession !== MatchPossession.OPPONENT) {
      return false;
    }

    return DEFENSIVE_ACTIONS.has(context.action) || GOALKEEPER_ACTIONS.has(context.action);
  }

  private shouldAttemptImmediateCounterAfterRecovery(
    context: ResolveMatchActionOutcomeParams['context'],
  ): boolean {
    if (!(DEFENSIVE_ACTIONS.has(context.action) || GOALKEEPER_ACTIONS.has(context.action))) {
      return false;
    }

    // Keep immediate counter goals rare and coherent:
    // only allow direct counter finish when recovery happens high (opponent defensive third).
    return context.zone === MatchFieldZone.ATTACK_THIRD;
  }

  private resolveOpponentTransitionChanceMultiplier(action: MatchAction): number {
    switch (action) {
      case MatchAction.PASS:
      case MatchAction.HOLD:
        return 0.45;
      case MatchAction.LONG_PASS:
      case MatchAction.DRIBBLE:
        return 0.7;
      case MatchAction.ATTACK:
      case MatchAction.SHOOT:
        return 0.85;
      default:
        return 0.7;
    }
  }

  private isTransitionCounterGoalContext(context: ResolveMatchActionOutcomeParams['context']): boolean {
    const riskyActions = new Set<MatchAction>([
      MatchAction.LONG_PASS,
      MatchAction.DRIBBLE,
      MatchAction.ATTACK,
      MatchAction.SHOOT,
    ]);

    if (!riskyActions.has(context.action)) {
      return false;
    }

    if (
      context.eventType !== MatchEventType.BALL_POSSESSION_EVENT &&
      context.eventType !== MatchEventType.ATTACK_EVENT
    ) {
      return false;
    }

    return context.zone !== MatchFieldZone.DEFENSE_THIRD;
  }

  private shouldMarkUserCounterGoal(context: ResolveMatchActionOutcomeParams['context']): boolean {
    if (context.possession !== MatchPossession.OPPONENT) {
      return false;
    }

    if (!(DEFENSIVE_ACTIONS.has(context.action) || GOALKEEPER_ACTIONS.has(context.action))) {
      return false;
    }

    return (
      context.eventType === MatchEventType.DEFENSE_EVENT ||
      context.eventType === MatchEventType.FREE_KICK_AGAINST_EVENT ||
      context.eventType === MatchEventType.CORNER_AGAINST_EVENT ||
      context.eventType === MatchEventType.THROW_IN_AGAINST_EVENT ||
      context.eventType === MatchEventType.BALL_POSSESSION_EVENT
    );
  }

  private pickRecoveredCarrierAfterDefensiveRecovery(params: {
    context: ResolveMatchActionOutcomeParams['context'];
    contextualUserPlayers: TeamPlayer[];
    fallbackUserPlayers: TeamPlayer[];
  }): TeamPlayer {
    const { context, contextualUserPlayers, fallbackUserPlayers } = params;
    const sourcePlayers = contextualUserPlayers.length ? contextualUserPlayers : fallbackUserPlayers;

    // Defensive recoveries in user low block should prioritize defenders;
    // recoveries in midfield/high zones should prioritize MF/FW to keep transitions fluid.
    const selectionAction =
      context.zone === MatchFieldZone.DEFENSE_THIRD ? MatchAction.DEFEND : MatchAction.ATTACK;
    return this.matchPlayerSelectionHelper.pickPlayerForAction(
      sourcePlayers,
      selectionAction,
      context.zone,
    );
  }

  private resolveLastPlayOutcome(input: {
    params: ResolveMatchActionOutcomeParams;
    scoreTeam: number;
    scoreOpponent: number;
    contextualUserPlayers: TeamPlayer[];
    contextualOpponentPlayers: TeamPlayer[];
  }): MatchActionOutcomeResult {
    const { params, contextualUserPlayers, contextualOpponentPlayers } = input;
    let { scoreTeam, scoreOpponent } = input;
    const eventType = params.context.eventType;
    const attackingSide = this.isLastPlayForEvent(eventType)
      ? MatchPossession.USER
      : MatchPossession.OPPONENT;
    const defendingSide =
      attackingSide === MatchPossession.USER
        ? MatchPossession.OPPONENT
        : MatchPossession.USER;
    const attackingPlayers =
      attackingSide === MatchPossession.USER
        ? contextualUserPlayers
        : contextualOpponentPlayers;
    const defendingPlayers =
      defendingSide === MatchPossession.USER
        ? contextualUserPlayers
        : contextualOpponentPlayers;
    const attackingTeamId =
      attackingSide === MatchPossession.USER
        ? params.match.teamId
        : params.match.opponentId;
    const attackingTeamName =
      attackingSide === MatchPossession.USER
        ? params.match.teamName
        : params.match.opponentName;
    const defendingTeamId =
      defendingSide === MatchPossession.USER
        ? params.match.teamId
        : params.match.opponentId;
    const defendingTeamName =
      defendingSide === MatchPossession.USER
        ? params.match.teamName
        : params.match.opponentName;
    const defaultAttackingAction = this.isLastPlayPenaltyEvent(eventType)
      ? MatchAction.LEFT
      : MatchAction.SHOOT;
    const attackingPlayer =
      attackingSide === MatchPossession.USER
        ? params.context.actingPlayer
        : this.matchPlayerSelectionHelper.pickPlayerForAction(
            attackingPlayers.length
              ? attackingPlayers
              : params.opponentPlayers,
            defaultAttackingAction,
            MatchFieldZone.BOX,
          );
    const attackSuccess = this.resolveLastPlayAttackSuccess(
      eventType,
      params.context.action,
    );

    if (attackSuccess) {
      if (attackingSide === MatchPossession.USER) {
        scoreTeam += 1;
      } else {
        scoreOpponent += 1;
      }

      return this.buildOutcome(params, {
        scoreTeam,
        scoreOpponent,
        message: this.i18nService.t('match.lastPlay.attackGoal', 'en', {
          playerName: attackingPlayer.name,
          teamName: attackingTeamName,
        }),
        isGoal: true,
        goalMessageKey:
          attackingSide === MatchPossession.USER
            ? 'match.turn.userGoal'
            : 'match.turn.opponentGoal',
        statTeamId: attackingTeamId,
        statTeamName: attackingTeamName,
        statPlayerName: attackingPlayer.name,
        statPlayerPosition: attackingPlayer.position,
        statAction: params.context.action,
        ballCarrierTeamId: attackingTeamId,
        ballCarrierName: attackingPlayer.name,
        nextPossession: attackingSide,
        nextZone: MatchFieldZone.BOX,
        nextEventType: MatchEventType.END,
        actingPlayer: attackingPlayer,
        actionOutcome:
          attackingSide === MatchPossession.USER
            ? MatchActionOutcome.SHOOT_USER_GOAL
            : MatchActionOutcome.SHOOT_OPPONENT_GOAL,
      });
    }

    const fallbackCounterPlayer = this.matchPlayerSelectionHelper.pickPlayerForAction(
      defendingPlayers.length
        ? defendingPlayers
        : defendingSide === MatchPossession.USER
          ? params.userPlayers
          : params.opponentPlayers,
      MatchAction.LONG_PASS,
      MatchFieldZone.ATTACK_THIRD,
    );
    const counterScorer = this.matchGoalScorerHelper.pickScorerForGoal({
      players:
        defendingSide === MatchPossession.USER
          ? params.userPlayers
          : params.opponentPlayers,
      fallbackPlayer: fallbackCounterPlayer,
      action: MatchAction.LONG_PASS,
      zone: MatchFieldZone.ATTACK_THIRD,
    });

    if (defendingSide === MatchPossession.USER) {
      scoreTeam += 1;
    } else {
      scoreOpponent += 1;
    }

    return this.buildOutcome(params, {
      scoreTeam,
      scoreOpponent,
      message: this.i18nService.t('match.lastPlay.counterGoal', 'en', {
        playerName: counterScorer.name,
        teamName: defendingTeamName,
      }),
      isGoal: true,
      goalMessageKey:
        defendingSide === MatchPossession.USER
          ? 'match.turn.userCounterGoal'
          : 'match.turn.opponentCounterGoal',
      statTeamId: defendingTeamId,
      statTeamName: defendingTeamName,
      statPlayerName: counterScorer.name,
      statPlayerPosition: counterScorer.position,
      statAction: params.context.action,
      ballCarrierTeamId: defendingTeamId,
      ballCarrierName: counterScorer.name,
      nextPossession: defendingSide,
      nextZone: MatchFieldZone.BOX,
      nextEventType: MatchEventType.END,
      actingPlayer: counterScorer,
      actionOutcome:
        defendingSide === MatchPossession.USER
          ? MatchActionOutcome.SHOOT_USER_GOAL
          : MatchActionOutcome.SHOOT_OPPONENT_GOAL,
    });
  }

  private isLastPlayEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT
    );
  }

  private isLastPlayForEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT
    );
  }

  private isLastPlayPenaltyEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT
    );
  }

  private resolveLastPlayAttackSuccess(
    eventType: MatchEventType,
    selectedAction: MatchAction,
  ): boolean {
    let chance = 0.54;

    switch (eventType) {
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
        chance = 0.64;
        break;
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        chance = 0.58;
        break;
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
        chance = 0.57;
        break;
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT:
        chance = 0.52;
        break;
      default:
        break;
    }

    const actionImpact = this.resolveLastPlayActionImpact(selectedAction);
    const finalChance = Math.min(0.9, Math.max(0.1, chance + actionImpact));
    return Math.random() < finalChance;
  }

  private resolveLastPlayActionImpact(action: MatchAction): number {
    switch (action) {
      case MatchAction.SHOOT:
      case MatchAction.LEFT:
      case MatchAction.RIGHT:
      case MatchAction.PICAR:
        return 0.08;
      case MatchAction.DRIBBLE:
      case MatchAction.ATTACK:
        return 0.05;
      case MatchAction.CENTER:
      case MatchAction.PASS:
        return 0.02;
      case MatchAction.DIVE_LEFT:
      case MatchAction.DIVE_RIGHT:
        return -0.08;
      case MatchAction.STAY_CENTER:
      case MatchAction.DEFEND:
        return -0.06;
      case MatchAction.WAIT:
      case MatchAction.BLOCK:
        return -0.03;
      default:
        return 0;
    }
  }

  private resolveNonDuelUserOutcome(action: MatchAction): MatchActionOutcome {
    switch (action) {
      case MatchAction.HOLD:
        return MatchActionOutcome.HOLD_STABLE;
      case MatchAction.ATTACK:
        return MatchActionOutcome.ATTACK_PROGRESS;
      case MatchAction.CROSS:
        return MatchActionOutcome.CROSS_CONNECTED;
      default:
        return MatchActionOutcome.NOT_HANDLED;
    }
  }

  private resolveNonDuelDefensiveOutcome(
    action: MatchAction,
    recoveredByUser: boolean,
  ): MatchActionOutcome {
    switch (action) {
      case MatchAction.PRESS:
        return recoveredByUser ? MatchActionOutcome.PRESS_WON : MatchActionOutcome.PRESS_LOST;
      case MatchAction.TACKLE:
        return recoveredByUser ? MatchActionOutcome.TACKLE_WON : MatchActionOutcome.TACKLE_LOST;
      case MatchAction.DEFEND:
      case MatchAction.BLOCK:
        return recoveredByUser ? MatchActionOutcome.DEFEND_HOLD : MatchActionOutcome.DEFEND_BROKEN;
      default:
        return MatchActionOutcome.NOT_HANDLED;
    }
  }
}
