import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import {
  MatchPenaltySaveContext,
  MatchPenaltySaveContextParams,
} from '../interfaces/match-discipline.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
/**
 * Centralizes card and penalty helper rules so service/engine remain orchestration-only.
 */
export class MatchDisciplineHelper extends AbstractMatchBasicHelper {
  constructor(private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper) {
    super();
  }

  resolveCardOutcome(eventType: MatchEventType): MatchCardType | null {
    switch (eventType) {
      case MatchEventType.YELLOW_CARD_EVENT:
        return MatchCardType.YELLOW;
      case MatchEventType.RED_CARD_EVENT:
        return MatchCardType.RED;
      default:
        return null;
    }
  }

  resolvePenaltyAwardedSide(eventType: MatchEventType): MatchPossession {
    return eventType === MatchEventType.PENALTY_FOR_EVENT ? MatchPossession.USER : MatchPossession.OPPONENT;
  }

  resolvePenaltySaveContext(params: MatchPenaltySaveContextParams): MatchPenaltySaveContext {
    const defendingSide =
      params.eventType === MatchEventType.PENALTY_FOR_EVENT
        ? MatchPossession.OPPONENT
        : MatchPossession.USER;
    const defendingTeamId =
      defendingSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId;
    const defendingTeamName =
      defendingSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName;
    const defendingPlayers =
      defendingSide === MatchPossession.USER
        ? params.userPlayers.length
          ? params.userPlayers
          : params.baseUserPlayers
        : params.opponentPlayers.length
          ? params.opponentPlayers
          : params.baseOpponentPlayers;
    const goalkeeper =
      defendingPlayers.find((player) => player.position === 'GK') ||
      this.matchPlayerSelectionHelper.pickPlayerForAction(
        defendingPlayers,
        MatchAction.DIVE_LEFT,
        MatchFieldZone.BOX,
      );

    return {
      defendingTeamId,
      defendingTeamName,
      goalkeeperName: goalkeeper?.name || this.fallbackPlayer().name,
    };
  }

  pickCardedSide(possession: MatchPossession): MatchPossession {
    const defendingSide = possession === MatchPossession.USER ? MatchPossession.OPPONENT : MatchPossession.USER;
    return this.chance(0.72) ? defendingSide : possession;
  }

  pickCardedPlayer(players: TeamPlayer[], zone: MatchFieldZone, eventType: MatchEventType): TeamPlayer {
    const fieldPool = [
      ...players.filter((player) => player.position === 'DF'),
      ...players.filter((player) => player.position === 'MF'),
      ...players.filter((player) => player.position === 'FW'),
    ];
    const keeperPool = players.filter((player) => player.position === 'GK');
    const includeGoalkeeper =
      zone === MatchFieldZone.BOX &&
      (eventType === MatchEventType.RED_CARD_EVENT || eventType === MatchEventType.YELLOW_CARD_EVENT) &&
      keeperPool.length > 0 &&
      this.chance(0.15);
    const pool = includeGoalkeeper ? [...fieldPool, ...keeperPool] : fieldPool;

    if (!pool.length) {
      return this.fallbackPlayer();
    }

    return this.pick(pool);
  }

  applyRedCardPenalty(match: MatchEntity, side: MatchPossession, position: string): void {
    const normalizedPosition = position.toUpperCase();

    switch (side) {
      case MatchPossession.USER:
        switch (normalizedPosition) {
          case 'FW':
            match.teamAttackPenalty += 1;
            return;
          case 'MF':
            match.teamMidfieldPenalty += 1;
            return;
          default:
            match.teamDefensePenalty += 1;
            return;
        }
      case MatchPossession.OPPONENT:
      default:
        switch (normalizedPosition) {
          case 'FW':
            match.opponentAttackPenalty += 1;
            return;
          case 'MF':
            match.opponentMidfieldPenalty += 1;
            return;
          default:
            match.opponentDefensePenalty += 1;
            return;
        }
    }
  }
}
