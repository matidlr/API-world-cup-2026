import { Injectable } from '@nestjs/common';
import { MatchEntity } from '../entity/match.entity';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import {
  ATTACKING_ACTIONS,
  DEFENSIVE_ACTIONS,
  GOALKEEPER_ACTIONS,
} from '../model/match-action-group.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import { TacticalSnapshot, TurnContext } from '../interfaces/match-service.interfaces';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

const EXPECTED_TEAM_SIZE = 11;
const GOAL_DUEL_IMPACT_FACTOR = 0.0012;
const GOAL_DUEL_IMPACT_CAP = 0.08;
const GOAL_NUMERIC_DISADVANTAGE_PENALTY = 0.04;
const COUNTER_NUMERIC_DISADVANTAGE_PENALTY = 0.03;
const TEAM_GOAL_BASE_CHANCE = 0.2;
const OPPONENT_GOAL_BASE_CHANCE = 0.15;
const COUNTER_BASE_CHANCE = 0.03;
const DEFENSIVE_RECOVERY_BASE_CHANCE = 0.24;
const TEAM_QUALITY_IMPACT_FACTOR = 0.001;
const TEAM_QUALITY_GOAL_IMPACT_CAP = 0.12;
const TEAM_QUALITY_COUNTER_IMPACT_CAP = 0.08;
const SHOOT_ACTIONS = new Set<MatchAction>([MatchAction.SHOOT, MatchAction.PICAR]);
const MODERATE_SCORING_ACTIONS = new Set<MatchAction>([MatchAction.CROSS]);

@Injectable()
/**
 * Encapsulates probability formulas for scoring and counters.
 * Keeping these formulas out of MatchService makes turn orchestration easier to read.
 */
export class MatchProbabilityHelper extends AbstractMatchBasicHelper {
  /**
   * Computes probability of user-side goal considering action/event/strategy and penalties.
   */
  resolveTeamGoalChance(
    match: MatchEntity,
    context: TurnContext,
    tactical: TacticalSnapshot,
    players: {
      attackingPlayers: TeamPlayer[];
      defendingPlayers: TeamPlayer[];
    },
  ): boolean {
    let chance = TEAM_GOAL_BASE_CHANCE;

    if (context.zone === MatchFieldZone.ATTACK_THIRD) {
      chance += 0.1;
    }

    if (context.zone === MatchFieldZone.BOX) {
      chance += 0.16;
    }

    if (context.eventType === MatchEventType.ATTACK_EVENT) {
      chance += 0.1;
    }

    if (context.action === MatchAction.SHOOT) {
      if (context.zone === MatchFieldZone.BOX) {
        chance += 0.1;
      } else if (context.zone === MatchFieldZone.ATTACK_THIRD) {
        chance += 0.05;
      }
    }

    if (context.eventType === MatchEventType.PENALTY_FOR_EVENT) {
      chance += 0.12;
    }

    if (
      context.eventType === MatchEventType.FREE_KICK_FOR_EVENT ||
      context.eventType === MatchEventType.CORNER_FOR_EVENT ||
      context.eventType === MatchEventType.THROW_IN_FOR_EVENT
    ) {
      chance += 0.08;
    }

    if (context.eventType === MatchEventType.THROW_IN_FOR_EVENT) {
      chance -= 0.03;
    }

    // Defensive actions should rarely become direct goals in the same play.
    if (DEFENSIVE_ACTIONS.has(context.action)) {
      chance -= 0.18;
    }

    if (
      DEFENSIVE_ACTIONS.has(context.action) &&
      context.zone !== MatchFieldZone.ATTACK_THIRD &&
      context.zone !== MatchFieldZone.BOX
    ) {
      chance -= 0.1;
    }

    if (GOALKEEPER_ACTIONS.has(context.action)) {
      chance -= 0.2;
    }

    chance += context.actingPlayer.attack * 0.0015;
    chance += context.actingPlayer.skill * 0.001;
    chance += this.resolveActingPlayerEnergyModifier(context.action, context.actingPlayer.energy);

    chance += this.resolveTeamGoalStrategyBonus(tactical.teamStrategy, context);
    chance += tactical.teamLine.attack * 0.004;
    chance -= tactical.opponentLine.defense * 0.004;
    chance -= tactical.teamPenaltyPoints * 0.01;
    chance += tactical.opponentPenaltyPoints * 0.005;
    chance += this.resolveMoraleGoalModifier(match, MatchPossession.USER);

    chance -= match.teamAttackPenalty * 0.06;
    chance += match.opponentDefensePenalty * 0.05;

    chance += this.resolveGoalDuelModifier(
      context.actingPlayer,
      players.defendingPlayers,
      context.zone,
    );
    chance = this.applyNumericDisadvantagePenalty(
      chance,
      players.attackingPlayers.length,
      players.defendingPlayers.length,
      GOAL_NUMERIC_DISADVANTAGE_PENALTY,
    );
    chance += this.resolveTeamQualityModifier(
      players.attackingPlayers,
      players.defendingPlayers,
      TEAM_QUALITY_GOAL_IMPACT_CAP,
    );
    chance *= this.resolveActionGoalChanceMultiplier(context.action);

    const minimumChance = this.resolveTeamGoalChanceFloor(context);
    chance = Math.min(0.9, Math.max(minimumChance, chance));
    return this.chance(chance);
  }

  /**
   * Computes probability of opponent-side goal considering action/event/strategy and penalties.
   */
  resolveOpponentGoalChance(
    match: MatchEntity,
    context: TurnContext,
    tactical: TacticalSnapshot,
    players: {
      attackingPlayers: TeamPlayer[];
      defendingPlayers: TeamPlayer[];
      attackingPlayer: TeamPlayer;
    },
    chanceMultiplier = 1,
  ): boolean {
    let chance = OPPONENT_GOAL_BASE_CHANCE;

    if (context.zone === MatchFieldZone.ATTACK_THIRD) {
      chance += 0.05;
    }

    if (context.zone === MatchFieldZone.BOX) {
      chance += 0.09;
    }

    if (context.possession === MatchPossession.USER) {
      if (context.zone === MatchFieldZone.BOX) {
        chance += 0.08;
      } else if (context.zone === MatchFieldZone.DEFENSE_THIRD) {
        chance += 0.04;
      }
    }

    if (context.eventType === MatchEventType.ATTACK_EVENT) {
      chance += 0.07;
    }

    if (context.eventType === MatchEventType.PENALTY_AGAINST_EVENT) {
      chance += 0.09;
    }

    if (
      context.eventType === MatchEventType.FREE_KICK_AGAINST_EVENT ||
      context.eventType === MatchEventType.CORNER_AGAINST_EVENT ||
      context.eventType === MatchEventType.THROW_IN_AGAINST_EVENT
    ) {
      chance += 0.06;
    }

    if (context.eventType === MatchEventType.THROW_IN_AGAINST_EVENT) {
      chance -= 0.025;
    }

    if (DEFENSIVE_ACTIONS.has(context.action)) {
      chance -= 0.1;
    }

    if (GOALKEEPER_ACTIONS.has(context.action)) {
      chance -= 0.12;
    }

    chance -= context.actingPlayer.defense * 0.001;
    chance -= context.actingPlayer.skill * 0.0008;

    chance += this.resolveOpponentGoalStrategyBonus(tactical.teamStrategy, context);
    chance += tactical.teamPenaltyPoints * 0.008;
    chance -= tactical.opponentPenaltyPoints * 0.008;
    chance += tactical.opponentLine.attack * 0.004;
    chance -= tactical.teamLine.defense * 0.004;
    chance += this.resolveMoraleGoalModifier(match, MatchPossession.OPPONENT);

    chance += match.teamDefensePenalty * 0.06;
    chance -= match.opponentAttackPenalty * 0.06;

    chance += this.resolveGoalDuelModifier(
      players.attackingPlayer,
      players.defendingPlayers,
      context.zone,
    );
    chance = this.applyNumericDisadvantagePenalty(
      chance,
      players.attackingPlayers.length,
      players.defendingPlayers.length,
      GOAL_NUMERIC_DISADVANTAGE_PENALTY,
    );
    chance += this.resolveTeamQualityModifier(
      players.attackingPlayers,
      players.defendingPlayers,
      TEAM_QUALITY_GOAL_IMPACT_CAP,
    );
    chance *= this.resolveActionGoalChanceMultiplier(context.action);
    chance *= chanceMultiplier;

    const minimumChance = this.resolveOpponentGoalChanceFloor(context);
    chance = Math.min(0.85, Math.max(minimumChance, chance));
    return this.chance(chance);
  }

  /**
   * Resolves contextual lower-bound for opponent direct goal chance.
   * Non-dangerous contexts should not carry a hard 5% guaranteed scoring floor.
   */
  private resolveOpponentGoalChanceFloor(context: TurnContext): number {
    if (
      context.eventType === MatchEventType.PENALTY_AGAINST_EVENT ||
      context.eventType === MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT
    ) {
      return 0.05;
    }

    if (
      context.eventType === MatchEventType.ATTACK_EVENT &&
      (context.zone === MatchFieldZone.ATTACK_THIRD || context.zone === MatchFieldZone.BOX)
    ) {
      return 0.025;
    }

    return 0;
  }

  /**
   * Resolves contextual lower-bound for team direct goal chance.
   * Non-attacking actions should not keep an artificial 5% scoring floor.
   */
  private resolveTeamGoalChanceFloor(context: TurnContext): number {
    if (
      context.eventType === MatchEventType.PENALTY_FOR_EVENT ||
      context.eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT
    ) {
      return 0.05;
    }

    if (
      context.action === MatchAction.SHOOT &&
      (context.zone === MatchFieldZone.ATTACK_THIRD || context.zone === MatchFieldZone.BOX)
    ) {
      return 0.025;
    }

    return 0;
  }

  /**
   * Computes probability of a successful counter by the user-side team.
   */
  resolveCounterChance(
    match: MatchEntity,
    context: TurnContext,
    tactical: TacticalSnapshot,
    players: {
      attackingPlayers: TeamPlayer[];
      defendingPlayers: TeamPlayer[];
    },
  ): boolean {
    let chance = COUNTER_BASE_CHANCE;

    if (DEFENSIVE_ACTIONS.has(context.action)) {
      chance += 0.015;
    }

    if (context.eventType !== MatchEventType.DEFENSE_EVENT) {
      chance -= 0.015;
    }

    chance += this.resolveCounterZoneBonus(context.zone);

    chance += this.resolveCounterStrategyBonus(tactical.teamStrategy, context);
    chance += tactical.teamLine.attack * 0.002;
    chance += context.actingPlayer.attack * 0.001;
    chance -= tactical.teamPenaltyPoints * 0.004;
    chance += tactical.opponentPenaltyPoints * 0.002;
    chance += this.resolveMoraleGoalModifier(match, MatchPossession.USER) * 0.5;

    chance -= match.teamAttackPenalty * 0.05;
    chance += match.opponentDefensePenalty * 0.05;

    chance = this.applyNumericDisadvantagePenalty(
      chance,
      players.attackingPlayers.length,
      players.defendingPlayers.length,
      COUNTER_NUMERIC_DISADVANTAGE_PENALTY,
    );
    chance += this.resolveTeamQualityModifier(
      players.attackingPlayers,
      players.defendingPlayers,
      TEAM_QUALITY_COUNTER_IMPACT_CAP,
    );

    chance = Math.min(0.14, Math.max(0.003, chance));
    return this.chance(chance);
  }

  /**
   * Computes probability of recovering possession when user executes a defensive action
   * while the opponent currently owns the ball.
   */
  resolveDefensiveRecoveryChance(
    match: MatchEntity,
    context: TurnContext,
    tactical: TacticalSnapshot,
    players: {
      recoveringPlayers: TeamPlayer[];
      possessingPlayers: TeamPlayer[];
    },
  ): boolean {
    if (context.possession !== MatchPossession.OPPONENT) {
      return false;
    }

    let chance = DEFENSIVE_RECOVERY_BASE_CHANCE;

    chance += this.resolveDefensiveRecoveryActionBonus(context.action);
    chance += this.resolveDefensiveRecoveryZoneBonus(context.zone);
    chance += this.resolveDefensiveRecoveryStrategyBonus(tactical.teamStrategy);

    chance += (tactical.teamLine.defense - tactical.opponentLine.attack) * 0.0025;
    chance += (tactical.teamLine.midfield - tactical.opponentLine.midfield) * 0.002;

    chance += context.actingPlayer.defense * 0.0011;
    chance += context.actingPlayer.skill * 0.0008;
    chance += context.actingPlayer.energy * 0.0004;

    chance += this.resolveMoraleGoalModifier(match, MatchPossession.USER) * 0.4;
    chance -= this.resolveMoraleGoalModifier(match, MatchPossession.OPPONENT) * 0.25;

    chance -= match.teamDefensePenalty * 0.03;
    chance += match.opponentAttackPenalty * 0.03;

    chance = this.applyNumericDisadvantagePenalty(
      chance,
      players.recoveringPlayers.length,
      players.possessingPlayers.length,
      0.02,
    );
    chance += this.resolveTeamQualityModifier(
      players.recoveringPlayers,
      players.possessingPlayers,
      0.07,
    );

    chance = Math.min(0.74, Math.max(0.14, chance));
    return this.chance(chance);
  }

  /**
   * Resolves who keeps the ball after a missed user shot.
   * This avoids immediate "instant opponent goal" and models a rebound duel first.
   */
  resolvePostMissedShotPossession(
    context: TurnContext,
    tactical: TacticalSnapshot,
    players: {
      attackingPlayers: TeamPlayer[];
      defendingPlayers: TeamPlayer[];
      attackingPlayer: TeamPlayer;
      defendingPlayer: TeamPlayer;
    },
  ): MatchPossession {
    let userRecoveryChance = 0.42;

    if (context.zone === MatchFieldZone.BOX) {
      userRecoveryChance -= 0.04;
    } else if (context.zone === MatchFieldZone.ATTACK_THIRD) {
      userRecoveryChance -= 0.02;
    }

    userRecoveryChance +=
      (players.attackingPlayer.attack - players.defendingPlayer.defense) * 0.0012;
    userRecoveryChance +=
      (players.attackingPlayer.skill - players.defendingPlayer.skill) * 0.001;
    userRecoveryChance +=
      (players.attackingPlayer.energy - players.defendingPlayer.energy) * 0.0006;

    userRecoveryChance += (tactical.teamLine.midfield - tactical.opponentLine.midfield) * 0.0025;
    userRecoveryChance -= tactical.teamPenaltyPoints * 0.003;
    userRecoveryChance += tactical.opponentPenaltyPoints * 0.003;

    userRecoveryChance = this.applyNumericDisadvantagePenalty(
      userRecoveryChance,
      players.attackingPlayers.length,
      players.defendingPlayers.length,
      0.015,
    );
    userRecoveryChance += this.resolveTeamQualityModifier(
      players.attackingPlayers,
      players.defendingPlayers,
      0.06,
    );

    userRecoveryChance = Math.min(0.72, Math.max(0.18, userRecoveryChance));
    return this.chance(userRecoveryChance) ? MatchPossession.USER : MatchPossession.OPPONENT;
  }

  /**
   * Applies duel impact between current attacker and best available defender (and GK when in box).
   */
  private resolveGoalDuelModifier(
    attackingPlayer: TeamPlayer,
    defendingPlayers: TeamPlayer[],
    zone: MatchFieldZone,
  ): number {
    if (!attackingPlayer || defendingPlayers.length === 0) {
      return 0;
    }

    const attackingPower = attackingPlayer.attack * 0.58 + attackingPlayer.skill * 0.32 + attackingPlayer.energy * 0.1;
    const defenderPower = this.resolveDefenderPower(defendingPlayers, zone);
    const duelDelta = attackingPower - defenderPower;
    const rawModifier = duelDelta * GOAL_DUEL_IMPACT_FACTOR;

    return Math.max(-GOAL_DUEL_IMPACT_CAP, Math.min(GOAL_DUEL_IMPACT_CAP, rawModifier));
  }

  /**
   * Resolves defensive reference power used by duel modifier.
   */
  private resolveDefenderPower(defendingPlayers: TeamPlayer[], zone: MatchFieldZone): number {
    const fieldDefenders = defendingPlayers.filter((player) => player.position !== 'GK');
    const markerDefense =
      fieldDefenders.length > 0
        ? Math.max(
          ...fieldDefenders.map(
            (player) => player.defense * 0.7 + player.skill * 0.2 + player.energy * 0.1,
          ),
        )
        : Math.max(
          ...defendingPlayers.map(
            (player) => player.defense * 0.7 + player.skill * 0.2 + player.energy * 0.1,
          ),
        );

    const goalkeepers = defendingPlayers.filter((player) => player.position === 'GK');
    const goalkeeperDefense =
      goalkeepers.length > 0
        ? Math.max(
          ...goalkeepers.map(
            (player) => player.defense * 0.65 + player.skill * 0.2 + player.energy * 0.15,
          ),
        )
        : markerDefense;

    if (zone === MatchFieldZone.BOX) {
      return markerDefense * 0.55 + goalkeeperDefense * 0.45;
    }

    if (zone === MatchFieldZone.ATTACK_THIRD) {
      return markerDefense * 0.75 + goalkeeperDefense * 0.25;
    }

    if (zone === MatchFieldZone.MIDFIELD) {
      return markerDefense * 0.85 + goalkeeperDefense * 0.15;
    }

    return markerDefense * 0.8 + goalkeeperDefense * 0.2;
  }

  /**
   * Applies an action-aware energy modifier.
   * Shooting actions are more sensitive to fatigue than regular actions.
   */
  private resolveActingPlayerEnergyModifier(action: MatchAction, energy: number): number {
    let modifier = (energy - 50) * 0.0008;

    if (!SHOOT_ACTIONS.has(action)) {
      return modifier;
    }

    if (energy >= 70) {
      modifier += 0.01;
    } else if (energy >= 60) {
      modifier += 0.005;
    } else if (energy >= 50) {
      modifier += 0;
    } else if (energy >= 40) {
      modifier -= 0.02;
    } else if (energy >= 30) {
      modifier -= 0.04;
    } else {
      modifier -= 0.06;
    }

    return modifier;
  }

  /**
   * Shapes finishing chance by action category:
   * - SHOOT/PICAR: main scoring channel
   * - CROSS: moderate scoring channel
   * - everything else: very low direct scoring chance
   */
  private resolveActionGoalChanceMultiplier(action: MatchAction): number {
    if (SHOOT_ACTIONS.has(action)) {
      return 1;
    }

    if (MODERATE_SCORING_ACTIONS.has(action)) {
      return 0.35;
    }

    if (DEFENSIVE_ACTIONS.has(action) || GOALKEEPER_ACTIONS.has(action)) {
      return 0.05;
    }

    return 0.1;
  }

  private resolveCounterZoneBonus(zone: MatchFieldZone): number {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return 0.02;
      case MatchFieldZone.MIDFIELD:
        return 0.006;
      case MatchFieldZone.ATTACK_THIRD:
        return -0.01;
      case MatchFieldZone.BOX:
        return -0.035;
      default:
        return 0;
    }
  }

  private resolveDefensiveRecoveryActionBonus(action: MatchAction): number {
    switch (action) {
      case MatchAction.TACKLE:
      case MatchAction.PRESS:
        return 0.09;
      case MatchAction.DEFEND:
      case MatchAction.BLOCK:
        return 0.07;
      case MatchAction.DIVE_LEFT:
      case MatchAction.DIVE_RIGHT:
      case MatchAction.STAY_CENTER:
      case MatchAction.WAIT:
        return 0.045;
      default:
        return 0.015;
    }
  }

  private resolveDefensiveRecoveryZoneBonus(zone: MatchFieldZone): number {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return 0.08;
      case MatchFieldZone.MIDFIELD:
        return 0.05;
      case MatchFieldZone.ATTACK_THIRD:
        return 0.02;
      case MatchFieldZone.BOX:
        return 0.03;
      default:
        return 0;
    }
  }

  private resolveDefensiveRecoveryStrategyBonus(strategy: MatchStrategy | null): number {
    switch (strategy) {
      case MatchStrategy.DEFENSE:
        return 0.05;
      case MatchStrategy.COUNTER_ATTACK:
        return 0.03;
      case MatchStrategy.BALANCED:
        return 0.015;
      case MatchStrategy.ATTACK:
        return -0.02;
      case MatchStrategy.PENALTIES:
        return -0.005;
      case MatchStrategy.POSSESSION:
        return -0.01;
      default:
        return 0;
    }
  }

  /**
   * Penalizes attacking side if it has fewer players on field than expected.
   * Also gives a smaller bonus when defending side has fewer players.
   */
  private applyNumericDisadvantagePenalty(
    chance: number,
    attackingPlayersCount: number,
    defendingPlayersCount: number,
    penaltyPerMissingPlayer: number,
  ): number {
    const attackingMissing = Math.max(0, EXPECTED_TEAM_SIZE - attackingPlayersCount);
    const defendingMissing = Math.max(0, EXPECTED_TEAM_SIZE - defendingPlayersCount);

    const attackingPenalty = attackingMissing * penaltyPerMissingPlayer;
    const defendingBonus = defendingMissing * penaltyPerMissingPlayer * 0.75;

    return chance - attackingPenalty + defendingBonus;
  }

  /**
   * Applies a global team quality delta (attacking side vs defending side).
   */
  private resolveTeamQualityModifier(
    attackingPlayers: TeamPlayer[],
    defendingPlayers: TeamPlayer[],
    cap: number,
  ): number {
    if (attackingPlayers.length === 0 || defendingPlayers.length === 0) {
      return 0;
    }

    const attackingQuality = this.resolveAverageQuality(attackingPlayers, 'attack');
    const defendingQuality = this.resolveAverageQuality(defendingPlayers, 'defense');
    const rawModifier = (attackingQuality - defendingQuality) * TEAM_QUALITY_IMPACT_FACTOR;

    return Math.max(-cap, Math.min(cap, rawModifier));
  }

  /**
   * Resolves average side quality depending on role in current action.
   */
  private resolveAverageQuality(
    players: TeamPlayer[],
    role: 'attack' | 'defense',
  ): number {
    const values = players.map((player) => {
      if (role === 'attack') {
        return player.attack * 0.55 + player.skill * 0.3 + player.energy * 0.15;
      }

      return player.defense * 0.55 + player.skill * 0.3 + player.energy * 0.15;
    });

    const sum = values.reduce((total, value) => total + value, 0);
    return sum / Math.max(1, values.length);
  }

  /**
   * Strategy-driven extra chance for team goals.
   */
  private resolveTeamGoalStrategyBonus(strategy: MatchStrategy | null, context: TurnContext): number {
    switch (strategy) {
      case MatchStrategy.ATTACK:
        return ATTACKING_ACTIONS.has(context.action) ? 0.08 : 0;
      case MatchStrategy.DEFENSE:
        return -0.04;
      case MatchStrategy.PENALTIES:
        return context.eventType === MatchEventType.PENALTY_FOR_EVENT ? 0.14 : 0;
      case MatchStrategy.COUNTER_ATTACK:
        return context.zone !== MatchFieldZone.DEFENSE_THIRD ? 0.06 : 0;
      case MatchStrategy.BALANCED:
        return 0.01;
      case MatchStrategy.POSSESSION:
        return context.action === MatchAction.PASS || context.action === MatchAction.HOLD ? 0.05 : 0;
      default:
        return 0;
    }
  }

  /**
   * Strategy-driven impact on opponent scoring chance.
   */
  private resolveOpponentGoalStrategyBonus(strategy: MatchStrategy | null, context: TurnContext): number {
    switch (strategy) {
      case MatchStrategy.ATTACK:
        return 0.05;
      case MatchStrategy.DEFENSE:
        return -0.08;
      case MatchStrategy.COUNTER_ATTACK:
        return -0.03;
      case MatchStrategy.PENALTIES:
        return context.eventType === MatchEventType.PENALTY_AGAINST_EVENT ? -0.1 : 0;
      case MatchStrategy.BALANCED:
        return -0.01;
      case MatchStrategy.POSSESSION:
        return context.action === MatchAction.PASS || context.action === MatchAction.HOLD ? -0.03 : 0;
      default:
        return 0;
    }
  }

  /**
   * Strategy-driven impact on counter-attack probability.
   */
  private resolveCounterStrategyBonus(strategy: MatchStrategy | null, context: TurnContext): number {
    switch (strategy) {
      case MatchStrategy.COUNTER_ATTACK:
        return 0.06;
      case MatchStrategy.DEFENSE:
        return DEFENSIVE_ACTIONS.has(context.action) ? 0.03 : 0;
      case MatchStrategy.ATTACK:
        return -0.02;
      default:
        return 0;
    }
  }

  /**
   * Applies short-term morale impact on goal probability from rivalry momentum.
   */
  private resolveMoraleGoalModifier(match: MatchEntity, side: MatchPossession): number {
    if (side === MatchPossession.USER) {
      let modifier = 0;
      if (match.teamMoraleBoostTurns > 0) {
        modifier += 0.06;
      }
      if (match.teamMoralePenaltyTurns > 0) {
        modifier -= 0.06;
      }
      return modifier;
    }

    let modifier = 0;
    if (match.opponentMoraleBoostTurns > 0) {
      modifier += 0.06;
    }
    if (match.opponentMoralePenaltyTurns > 0) {
      modifier -= 0.06;
    }
    return modifier;
  }
}
