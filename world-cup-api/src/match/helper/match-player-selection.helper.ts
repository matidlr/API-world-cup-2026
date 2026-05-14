import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { ATTACKING_ACTIONS, DEFENSIVE_ACTIONS } from '../model/match-action-group.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
/**
 * Centralizes player selection by action and zone so engine/service do not duplicate
 * position-priority heuristics.
 */
export class MatchPlayerSelectionHelper extends AbstractMatchBasicHelper {
  pickPlayerForAction(players: TeamPlayer[], action: MatchAction, zone: MatchFieldZone): TeamPlayer {
    const preferredPositions = this.getPreferredPositions(action, zone);

    for (const preferredPosition of preferredPositions) {
      const candidates = players.filter((player) => player.position === preferredPosition);
      if (candidates.length > 0) {
        return this.pick(candidates);
      }
    }

    return this.pick(players, this.fallbackPlayer());
  }

  private getPreferredPositions(action: MatchAction, zone: MatchFieldZone): string[] {
    switch (action) {
      case MatchAction.SHOOT:
      case MatchAction.LEFT:
      case MatchAction.RIGHT:
        return ['FW', 'MF', 'DF', 'GK'];
      case MatchAction.PASS:
      case MatchAction.HOLD:
      case MatchAction.LONG_PASS:
        switch (zone) {
          case MatchFieldZone.DEFENSE_THIRD:
            return ['DF', 'MF', 'FW', 'GK'];
          case MatchFieldZone.MIDFIELD:
            return ['MF', 'FW', 'DF', 'GK'];
          case MatchFieldZone.ATTACK_THIRD:
          case MatchFieldZone.BOX:
            return ['FW', 'MF', 'DF', 'GK'];
          default:
            return ['MF', 'FW', 'DF', 'GK'];
        }
      case MatchAction.ATTACK:
      case MatchAction.DRIBBLE:
      case MatchAction.CROSS:
      case MatchAction.CENTER:
      case MatchAction.PICAR:
        return ['FW', 'MF', 'DF', 'GK'];
      default:
        if (DEFENSIVE_ACTIONS.has(action) || zone === MatchFieldZone.DEFENSE_THIRD) {
          return ['DF', 'MF', 'FW', 'GK'];
        }

        if (zone === MatchFieldZone.BOX || ATTACKING_ACTIONS.has(action)) {
          return ['FW', 'MF', 'DF', 'GK'];
        }

        return ['MF', 'FW', 'DF', 'GK'];
    }
  }
}
