import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchGoalScorerSelectionParams } from '../interfaces/match-goal-scorer.interface';
import { MatchAction } from '../model/match-action.enum';
import { ATTACKING_ACTIONS, DEFENSIVE_ACTIONS } from '../model/match-action-group.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
/**
 * Resolves goal scorers using weighted position/action/zone heuristics.
 */
export class MatchGoalScorerHelper extends AbstractMatchBasicHelper {
  pickScorerForGoal(params: MatchGoalScorerSelectionParams): TeamPlayer {
    if (!params.players.length) {
      return params.fallbackPlayer;
    }

    const outfieldPlayers = params.players.filter((player) => player.position !== 'GK');
    const pool = outfieldPlayers.length ? outfieldPlayers : params.players;
    const weightedPool = pool.map((player) => ({
      player,
      weight: this.resolveScorerWeight(player, params.action, params.zone, params.fallbackPlayer.playerId),
    }));

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      return params.fallbackPlayer;
    }

    let roll = this.random() * totalWeight;
    for (const item of weightedPool) {
      roll -= item.weight;
      if (roll <= 0) {
        return item.player;
      }
    }

    return weightedPool[weightedPool.length - 1]?.player || params.fallbackPlayer;
  }

  private resolveScorerWeight(
    player: TeamPlayer,
    action: MatchAction,
    zone: MatchFieldZone,
    fallbackPlayerId: string,
  ): number {
    const attackingScore = player.attack * 0.75 + player.skill * 0.25;
    const baseWeight = Math.max(1, attackingScore / 18);
    const positionFactor =
      player.position === 'FW' ? 2.8 : player.position === 'MF' ? 1.7 : player.position === 'DF' ? 0.55 : 0.05;
    const zoneFactor =
      zone === MatchFieldZone.BOX ? 1.35
        : zone === MatchFieldZone.ATTACK_THIRD ? 1.15
          : zone === MatchFieldZone.MIDFIELD ? 0.7
            : 0.45;
    const actionFactor =
      action === MatchAction.SHOOT || action === MatchAction.PICAR ? 1.25
        : ATTACKING_ACTIONS.has(action) ? 1.1
          : DEFENSIVE_ACTIONS.has(action) ? 0.75
            : 1;
    const fallbackBonus = player.playerId === fallbackPlayerId ? 0.25 : 0;

    return Math.max(0.1, baseWeight * positionFactor * zoneFactor * actionFactor + fallbackBonus);
  }
}
