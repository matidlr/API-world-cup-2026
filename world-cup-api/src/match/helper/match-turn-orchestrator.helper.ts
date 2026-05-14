import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import {
  RestartDescriptor,
  TurnAdvanceResult,
  TurnContext,
} from '../interfaces/match-service.interfaces';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';

@Injectable()
/**
 * Orchestrates turn-stage transitions for MatchService.
 * It centralizes deterministic flow steps so play() can stay focused on
 * business decisions and persistence side effects.
 */
export class MatchTurnOrchestratorHelper extends AbstractMatchBasicHelper {
  constructor(private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper) {
    super();
  }

  /**
   * Normalizes possession for special restart-like events.
   */
  normalizePossessionForEvent(
    rawEventType: MatchEventType,
    possession: MatchPossession,
  ): MatchPossession {
    if (
      rawEventType === MatchEventType.PENALTY_FOR_EVENT ||
      rawEventType === MatchEventType.FREE_KICK_FOR_EVENT ||
      rawEventType === MatchEventType.CORNER_FOR_EVENT ||
      rawEventType === MatchEventType.THROW_IN_FOR_EVENT
    ) {
      return MatchPossession.USER;
    }

    if (
      rawEventType === MatchEventType.PENALTY_AGAINST_EVENT ||
      rawEventType === MatchEventType.FREE_KICK_AGAINST_EVENT ||
      rawEventType === MatchEventType.CORNER_AGAINST_EVENT ||
      rawEventType === MatchEventType.THROW_IN_AGAINST_EVENT
    ) {
      return MatchPossession.OPPONENT;
    }

    return possession;
  }

  /**
   * Builds turn context and computes next minute progression for the match.
   */
  buildTurnAdvance(params: {
    match: MatchEntity;
    selectedAction: MatchAction;
    rawEventType: MatchEventType;
    possession: MatchPossession;
    zone: MatchFieldZone;
    userPlayers: TeamPlayer[];
    baseUserPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
    baseOpponentPlayers: TeamPlayer[];
  }): TurnAdvanceResult {
    const {
      match,
      selectedAction,
      rawEventType,
      possession,
      zone,
      userPlayers,
      baseUserPlayers,
      opponentPlayers,
      baseOpponentPlayers,
    } = params;

    const actingTeamId = match.teamId;
    const actingTeamName = match.teamName;
    const actingPlayers = userPlayers.length ? userPlayers : baseUserPlayers;
    const actingAction = selectedAction;
    const actingPlayer = this.matchPlayerSelectionHelper.pickPlayerForAction(
      actingPlayers,
      actingAction,
      zone,
    );
    const nextMinute = this.resolveNextMinute(match);

    return {
      nextMinute,
      turnContext: {
        action: actingAction,
        eventType: rawEventType,
        possession,
        zone,
        actingTeamId,
        actingTeamName,
        actingPlayer,
      },
    };
  }

  /**
   * Computes minute progression with late-game pacing:
   * - keeps enough minutes for remaining turns
   * - slows down when game is tight in final turns (dramatic finish)
   * - avoids getting stuck at 89 too early
   */
  private resolveNextMinute(match: MatchEntity): number {
    const halfTurns = Math.max(1, Math.floor(match.maxTurns / 2));
    const playedTurns = Math.max(0, match.turn - 1);
    const nextPlayNumber = playedTurns + 1;
    const isFirstHalfTurn = nextPlayNumber <= halfTurns;
    const goalDiff = Math.abs(match.scoreTeam - match.scoreOpponent);

    const remainingTurns = isFirstHalfTurn
      ? Math.max(1, halfTurns - playedTurns)
      : Math.max(1, match.maxTurns - playedTurns);
    const currentMinute = isFirstHalfTurn
      ? Math.min(match.minute, 45)
      : Math.max(46, match.minute);
    const halfLimitMinute = isFirstHalfTurn ? 45 : 89;
    const remainingMinutes = Math.max(1, halfLimitMinute - currentMinute);

    // Keep at least one minute of progression available for each future turn in the same half.
    const reservedForFutureTurns = Math.max(0, remainingTurns - 1);
    const maxAdvanceAllowed = Math.max(1, remainingMinutes - reservedForFutureTurns);
    const baseAdvance = Math.max(1, Math.floor(remainingMinutes / remainingTurns));

    let minAdvance = 1;
    let maxAdvance = maxAdvanceAllowed;

    if (goalDiff <= 1 && remainingTurns <= 3) {
      minAdvance = 1;
      maxAdvance = Math.min(maxAdvanceAllowed, Math.max(1, baseAdvance + 1));
    } else if (goalDiff <= 1 && remainingTurns <= 5) {
      minAdvance = Math.max(1, baseAdvance - 1);
      maxAdvance = Math.min(maxAdvanceAllowed, baseAdvance + 2);
    } else {
      minAdvance = Math.max(2, baseAdvance);
      maxAdvance = Math.min(maxAdvanceAllowed, baseAdvance + 4);
    }

    if (minAdvance > maxAdvance) {
      minAdvance = maxAdvance;
    }

    const advance = this.randomInt(minAdvance, maxAdvance);
    const nextMinute = Math.min(halfLimitMinute, currentMinute + advance);
    if (isFirstHalfTurn) {
      return nextMinute;
    }

    return Math.max(46, nextMinute);
  }

  /**
   * Applies base state updates to match for a resolved turn context.
   */
  applyTurnAdvanceToMatch(
    match: MatchEntity,
    turnAdvance: TurnAdvanceResult,
    rawEventType: MatchEventType,
  ): void {
    match.minute = turnAdvance.nextMinute;
    match.turn += 1;
    match.currentZone = turnAdvance.turnContext.zone;
    match.possessionTeam = turnAdvance.turnContext.possession;
    match.ballCarrierTeamId = turnAdvance.turnContext.actingTeamId;
    match.ballCarrierName = turnAdvance.turnContext.actingPlayer.name;
    match.eventType = rawEventType;
  }

  /**
   * Applies forfeit terminal state to match.
   */
  applyForfeitState(match: MatchEntity): void {
    match.scoreOpponent = Math.max(3, match.scoreOpponent);
    match.minute = 90;
    match.isFinished = true;
    match.isActive = false;
    match.eventType = MatchEventType.FORFEIT_EVENT;
  }

  /**
   * Resolves restart descriptor after card incidents.
   * For card-restarters, non-penalty events keep the current zone.
   */
  resolveCardRestartDescriptor(
    eventType: MatchEventType,
    fallbackZone: MatchFieldZone,
  ): RestartDescriptor {
    return this.resolveRestartDescriptor(eventType, fallbackZone, false);
  }

  /**
   * Resolves restart descriptor generated from open-play incidents.
   * Corners generated from open play are always in the box.
   */
  resolveOpenPlayRestartDescriptor(
    eventType: MatchEventType,
    fallbackZone: MatchFieldZone,
  ): RestartDescriptor {
    return this.resolveRestartDescriptor(eventType, fallbackZone, true);
  }

  /**
   * Single source for restart descriptors.
   */
  resolveRestartDescriptor(
    eventType: MatchEventType,
    fallbackZone: MatchFieldZone,
    forceCornerInBox: boolean,
  ): RestartDescriptor {
    switch (eventType) {
      case MatchEventType.PENALTY_FOR_EVENT:
        return {
          action: MatchAction.LEFT,
          zone: MatchFieldZone.BOX,
          messageKey: 'match.restart.penaltyFor',
        };
      case MatchEventType.PENALTY_AGAINST_EVENT:
        return {
          action: MatchAction.DIVE_LEFT,
          zone: MatchFieldZone.BOX,
          messageKey: 'match.restart.penaltyAgainst',
        };
      case MatchEventType.CORNER_FOR_EVENT:
      case MatchEventType.CORNER_AGAINST_EVENT:
        return {
          action: MatchAction.CROSS,
          zone: forceCornerInBox ? MatchFieldZone.BOX : fallbackZone,
          messageKey: 'match.restart.corner',
        };
      case MatchEventType.THROW_IN_FOR_EVENT:
      case MatchEventType.THROW_IN_AGAINST_EVENT:
        return {
          action: MatchAction.PASS,
          zone: fallbackZone,
          messageKey: 'match.restart.throwIn',
        };
      default:
        return {
          action: MatchAction.LONG_PASS,
          zone: fallbackZone,
          messageKey: 'match.restart.freeKick',
        };
    }
  }
}
