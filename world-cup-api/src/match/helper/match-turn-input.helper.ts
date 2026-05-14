import { Injectable } from '@nestjs/common';
import { TacticalSnapshot } from '../interfaces/match-service.interfaces';
import { MatchAction } from '../model/match-action.enum';
import { ATTACKING_ACTIONS, DEFENSIVE_ACTIONS } from '../model/match-action-group.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { resolveAllowedZonesForEvent } from '../model/match-event-matrix.model';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import { MatchTacticalHelper } from './match-tactical.helper';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
/**
 * Encapsulates event/possession/zone selection rules used to define each turn.
 */
export class MatchTurnInputHelper extends AbstractMatchBasicHelper {
  constructor(private readonly matchTacticalHelper: MatchTacticalHelper) {
    super();
  }

  pickEventType(strategy: MatchStrategy | null, possession: MatchPossession): MatchEventType {
    const random = this.random();

    if (random < 0.05) {
      return MatchEventType.RED_CARD_EVENT;
    }

    if (random < 0.16) {
      return MatchEventType.YELLOW_CARD_EVENT;
    }

    const normalTurnPenaltyChance = 0.03;
    if (this.chance(normalTurnPenaltyChance)) {
      return possession === MatchPossession.USER
        ? MatchEventType.PENALTY_FOR_EVENT
        : MatchEventType.PENALTY_AGAINST_EVENT;
    }

    switch (strategy) {
      case MatchStrategy.ATTACK:
        if (random < 0.4) {
          return MatchEventType.ATTACK_EVENT;
        }
        break;
      case MatchStrategy.DEFENSE:
        if (random < 0.4) {
          return MatchEventType.DEFENSE_EVENT;
        }
        break;
      case MatchStrategy.PENALTIES:
        if (random < 0.4) {
          return random < 0.22 ? MatchEventType.ATTACK_EVENT : MatchEventType.DEFENSE_EVENT;
        }
        break;
      case MatchStrategy.COUNTER_ATTACK:
        if (random < 0.4) {
          return MatchEventType.ATTACK_EVENT;
        }
        break;
      case MatchStrategy.POSSESSION:
        if (random < 0.4) {
          return this.pickRestartEventFromOpenPlay(possession);
        }
        break;
      case MatchStrategy.BALANCED:
        if (random < 0.34) {
          return random < 0.17 ? MatchEventType.ATTACK_EVENT : MatchEventType.DEFENSE_EVENT;
        }
        break;
      default:
        break;
    }

    if (random < 0.24) {
      const specialEvents = [
        MatchEventType.ATTACK_EVENT,
        MatchEventType.DEFENSE_EVENT,
        this.pickRestartEventFromOpenPlay(possession),
      ];

      return specialEvents[this.randomInt(0, specialEvents.length - 1)];
    }

    return MatchEventType.BALL_POSSESSION_EVENT;
  }

  pickPossession(action: MatchAction, tactical: TacticalSnapshot): MatchPossession {
    let userChance = 0.56;

    if (ATTACKING_ACTIONS.has(action)) {
      userChance += 0.08;
    }

    if (DEFENSIVE_ACTIONS.has(action)) {
      userChance -= 0.04;
    }

    userChance += this.matchTacticalHelper.resolvePossessionStrategyBonus(tactical.teamStrategy);
    userChance -= this.matchTacticalHelper.resolvePossessionStrategyBonus(tactical.opponentStrategy);

    userChance += (tactical.teamLine.midfield - tactical.opponentLine.midfield) * 0.004;
    userChance -= tactical.teamPenaltyPoints * 0.003;
    userChance += tactical.opponentPenaltyPoints * 0.003;

    userChance +=
      (this.matchTacticalHelper.estimateFormationMidfieldWeight(tactical.teamFormation) -
        this.matchTacticalHelper.estimateFormationMidfieldWeight(tactical.opponentFormation)) *
      0.012;

    return this.chance(Math.min(0.8, Math.max(0.2, userChance)))
      ? MatchPossession.USER
      : MatchPossession.OPPONENT;
  }

  pickZone(action: MatchAction, possession: MatchPossession, eventType: MatchEventType): MatchFieldZone {
    const roll = this.random();
    let zone: MatchFieldZone;

    if (
      eventType === MatchEventType.PENALTY_FOR_EVENT ||
      eventType === MatchEventType.PENALTY_AGAINST_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT
    ) {
      return MatchFieldZone.BOX;
    }

    if (possession === MatchPossession.USER) {
      if (ATTACKING_ACTIONS.has(action) && roll < 0.4) {
        zone = MatchFieldZone.BOX;
      } else if (roll < 0.74) {
        zone = MatchFieldZone.ATTACK_THIRD;
      } else if (roll < 0.88) {
        zone = MatchFieldZone.MIDFIELD;
      } else {
        zone = MatchFieldZone.DEFENSE_THIRD;
      }
    } else if (eventType === MatchEventType.DEFENSE_EVENT && roll < 0.4) {
      zone = MatchFieldZone.DEFENSE_THIRD;
    } else if (roll < 0.28) {
      zone = MatchFieldZone.BOX;
    } else if (roll < 0.66) {
      zone = MatchFieldZone.ATTACK_THIRD;
    } else if (roll < 0.82) {
      zone = MatchFieldZone.MIDFIELD;
    } else {
      zone = MatchFieldZone.DEFENSE_THIRD;
    }

    const allowedZones = resolveAllowedZonesForEvent(eventType);
    if (allowedZones.includes(zone)) {
      return zone;
    }

    return allowedZones[this.randomInt(0, allowedZones.length - 1)];
  }

  resolvePenaltyAwardedSide(eventType: MatchEventType): MatchPossession {
    return eventType === MatchEventType.PENALTY_FOR_EVENT ? MatchPossession.USER : MatchPossession.OPPONENT;
  }

  private pickRestartEventFromOpenPlay(possession: MatchPossession): MatchEventType {
    if (possession === MatchPossession.USER) {
      const userPool = [
        MatchEventType.FREE_KICK_FOR_EVENT,
        MatchEventType.CORNER_FOR_EVENT,
        MatchEventType.THROW_IN_FOR_EVENT,
      ];
      return userPool[this.randomInt(0, userPool.length - 1)];
    }

    const opponentPool = [
      MatchEventType.FREE_KICK_AGAINST_EVENT,
      MatchEventType.CORNER_AGAINST_EVENT,
      MatchEventType.THROW_IN_AGAINST_EVENT,
    ];
    return opponentPool[this.randomInt(0, opponentPool.length - 1)];
  }
}
