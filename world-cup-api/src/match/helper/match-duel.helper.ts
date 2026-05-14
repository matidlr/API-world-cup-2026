import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import {
  MatchDuelHelperContract,
  MatchDuelInput,
  MatchDuelResult,
} from '../interfaces/match-duel.interface';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchActionTransitionHelper } from './match-action-transition.helper';

const FORWARD_POSITIONS = new Set(['FW']);
const MID_POSITIONS = new Set(['MF']);
const DEFENSIVE_POSITIONS = new Set(['DF', 'GK']);

@Injectable()
/**
 * Resolves per-action duels using contextual teammates/opponents.
 * It returns a structured outcome that keeps MatchService orchestration simple
 * and extensible for new actions in future iterations.
 */
export class MatchDuelHelper extends AbstractMatchBasicHelper implements MatchDuelHelperContract {
  constructor(private readonly matchActionTransitionHelper: MatchActionTransitionHelper) {
    super();
  }

  resolveDuel(input: MatchDuelInput): MatchDuelResult {
    const { context, action } = input;
    const fromPlayer = context.actingPlayer;
    const defendingFallback = context.opponentsInZone[0] || context.actingPlayer;

    switch (action) {
      case MatchAction.PASS:
        return this.resolvePassLikeDuel(input, false);
      case MatchAction.LONG_PASS:
        return this.resolvePassLikeDuel(input, true);
      case MatchAction.DRIBBLE:
        return this.resolveDribbleDuel(input);
      case MatchAction.SHOOT:
        return this.resolveShootDuel(input);
      default:
        return {
          handled: false,
          outcome: MatchActionOutcome.NOT_HANDLED,
          success: false,
          fromPlayer,
          toPlayer: fromPlayer,
          defenderPlayer: defendingFallback,
          nextZone: context.zone,
          nextPossession: context.possession,
          wasSavedByGoalkeeper: false,
        };
    }
  }

  private resolvePassLikeDuel(input: MatchDuelInput, isLongPass: boolean): MatchDuelResult {
    const { context } = input;
    const fromPlayer = context.actingPlayer;
    const defender = this.pickDefender(context.opponentsInZone);
    const receiver = this.pickReceiver(context.teammatesInZone, fromPlayer, context.zone);

    const attackerScore = this.computeAttackerScore(
      fromPlayer,
      receiver,
      isLongPass ? MatchAction.LONG_PASS : MatchAction.PASS,
    );
    const defenderScore = this.computeDefenderScore(defender, context.zone, false);
    const baseChance = isLongPass ? 0.57 : 0.69;
    const successChance = this.clamp(baseChance + (attackerScore - defenderScore) * 0.0025, 0.2, 0.93);
    const success = this.chance(successChance);

    if (success) {
      const transition = this.matchActionTransitionHelper.resolveTransition({
        context,
        action: isLongPass ? MatchAction.LONG_PASS : MatchAction.PASS,
        actionOutcome: isLongPass
          ? MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS
          : MatchActionOutcome.PASS_SUCCESS_PROGRESS,
      });
      return {
        handled: true,
        outcome: isLongPass
          ? MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS
          : MatchActionOutcome.PASS_SUCCESS_PROGRESS,
        success: true,
        fromPlayer,
        toPlayer: receiver,
        defenderPlayer: defender,
        nextZone: transition.nextZone,
        nextPossession: transition.nextPossession,
        wasSavedByGoalkeeper: false,
      };
    }

    const transition = this.matchActionTransitionHelper.resolveTransition({
      context,
      action: isLongPass ? MatchAction.LONG_PASS : MatchAction.PASS,
      actionOutcome: isLongPass ? MatchActionOutcome.LONG_PASS_LOST : MatchActionOutcome.PASS_INTERCEPTED,
    });

    return {
      handled: true,
      outcome: isLongPass ? MatchActionOutcome.LONG_PASS_LOST : MatchActionOutcome.PASS_INTERCEPTED,
      success: false,
      fromPlayer,
      toPlayer: defender,
      defenderPlayer: defender,
      nextZone: transition.nextZone,
      nextPossession: transition.nextPossession,
      wasSavedByGoalkeeper: false,
    };
  }

  private resolveDribbleDuel(input: MatchDuelInput): MatchDuelResult {
    const { context } = input;
    const fromPlayer = context.actingPlayer;
    const defender = this.pickDefender(context.opponentsInZone);
    const attackerScore = this.computeAttackerScore(fromPlayer, fromPlayer, MatchAction.DRIBBLE);
    const defenderScore = this.computeDefenderScore(defender, context.zone, false);
    const successChance = this.clamp(0.54 + (attackerScore - defenderScore) * 0.0023, 0.2, 0.9);
    const success = this.chance(successChance);

    if (success) {
      const transition = this.matchActionTransitionHelper.resolveTransition({
        context,
        action: MatchAction.DRIBBLE,
        actionOutcome: MatchActionOutcome.DRIBBLE_WON,
      });
      return {
        handled: true,
        outcome: MatchActionOutcome.DRIBBLE_WON,
        success: true,
        fromPlayer,
        toPlayer: fromPlayer,
        defenderPlayer: defender,
        nextZone: transition.nextZone,
        nextPossession: transition.nextPossession,
        wasSavedByGoalkeeper: false,
      };
    }

    const transition = this.matchActionTransitionHelper.resolveTransition({
      context,
      action: MatchAction.DRIBBLE,
      actionOutcome: MatchActionOutcome.DRIBBLE_LOST,
    });

    return {
      handled: true,
      outcome: MatchActionOutcome.DRIBBLE_LOST,
      success: false,
      fromPlayer,
      toPlayer: defender,
      defenderPlayer: defender,
      nextZone: transition.nextZone,
      nextPossession: transition.nextPossession,
      wasSavedByGoalkeeper: false,
    };
  }

  private resolveShootDuel(input: MatchDuelInput): MatchDuelResult {
    const { context } = input;
    const shooter = context.actingPlayer;
    const goalkeeper = this.pickGoalkeeper(context.opponentsInZone);
    const defender = this.pickDefender(context.opponentsInZone);
    const onTargetChance = this.resolveShotOnTargetChance(shooter, context.zone);
    const shotOnTarget = this.chance(onTargetChance);
    const duelDefender = this.resolveShotPrimaryDefender(goalkeeper, defender, context.zone);
    const isClearMiss = !shotOnTarget;

    if (isClearMiss) {
      const missCollector = this.resolveMissCollector(goalkeeper, defender, context.zone);
      const transition = this.matchActionTransitionHelper.resolveTransition({
        context,
        action: MatchAction.SHOOT,
        actionOutcome: MatchActionOutcome.SHOOT_MISSED,
      });

      return {
        handled: true,
        outcome: MatchActionOutcome.SHOOT_MISSED,
        success: false,
        fromPlayer: shooter,
        toPlayer: missCollector,
        defenderPlayer: missCollector,
        nextZone: transition.nextZone,
        nextPossession: transition.nextPossession,
        wasSavedByGoalkeeper: false,
      };
    }

    const savedByGoalkeeper = Boolean(goalkeeper) && duelDefender.playerId === goalkeeper.playerId;
    const reboundForAttackingTeamChance = this.resolveReboundForAttackingTeamChance(
      savedByGoalkeeper,
      context.zone,
    );
    const reboundHolder = this.chance(reboundForAttackingTeamChance)
      ? this.pickReceiver(context.teammatesInZone, shooter, context.zone)
      : duelDefender;
    const reboundForActingTeam = reboundHolder.playerId !== duelDefender.playerId;

    const outcome = this.resolveShootMissOutcome(reboundForActingTeam, savedByGoalkeeper);
    const transition = this.matchActionTransitionHelper.resolveTransition({
      context,
      action: MatchAction.SHOOT,
      actionOutcome: outcome,
    });

    return {
      handled: true,
      outcome,
      success: false,
      fromPlayer: shooter,
      toPlayer: reboundHolder,
      defenderPlayer: duelDefender,
      nextZone: transition.nextZone,
      nextPossession: transition.nextPossession,
      wasSavedByGoalkeeper: savedByGoalkeeper,
    };
  }

  private resolveShotOnTargetChance(shooter: TeamPlayer, zone: MatchFieldZone): number {
    const baseByZone: Record<MatchFieldZone, number> = {
      [MatchFieldZone.BOX]: 0.69,
      [MatchFieldZone.ATTACK_THIRD]: 0.54,
      [MatchFieldZone.MIDFIELD]: 0.28,
      [MatchFieldZone.DEFENSE_THIRD]: 0.15,
    };
    const base = baseByZone[zone] ?? 0.4;
    const shooterSkillFactor = (shooter.attack + shooter.skill) * 0.5;
    return this.clamp(base + (shooterSkillFactor - 75) * 0.0028, 0.1, 0.88);
  }

  private resolveShotPrimaryDefender(
    goalkeeper: TeamPlayer | null,
    defender: TeamPlayer,
    zone: MatchFieldZone,
  ): TeamPlayer {
    if (!goalkeeper) {
      return defender;
    }

    const goalkeeperInvolvementByZone: Record<MatchFieldZone, number> = {
      [MatchFieldZone.BOX]: 0.64,
      [MatchFieldZone.ATTACK_THIRD]: 0.48,
      [MatchFieldZone.MIDFIELD]: 0.34,
      [MatchFieldZone.DEFENSE_THIRD]: 0.26,
    };
    const goalkeeperChance = goalkeeperInvolvementByZone[zone] ?? 0.5;
    return this.chance(goalkeeperChance) ? goalkeeper : defender;
  }

  private resolveMissCollector(
    goalkeeper: TeamPlayer | null,
    defender: TeamPlayer,
    zone: MatchFieldZone,
  ): TeamPlayer {
    if (!goalkeeper) {
      return defender;
    }

    const goalkeeperCollectByZone: Record<MatchFieldZone, number> = {
      [MatchFieldZone.BOX]: 0.44,
      [MatchFieldZone.ATTACK_THIRD]: 0.26,
      [MatchFieldZone.MIDFIELD]: 0.12,
      [MatchFieldZone.DEFENSE_THIRD]: 0.08,
    };
    return this.chance(goalkeeperCollectByZone[zone] ?? 0.2) ? goalkeeper : defender;
  }

  private resolveReboundForAttackingTeamChance(
    savedByGoalkeeper: boolean,
    zone: MatchFieldZone,
  ): number {
    const savedChanceByZone: Record<MatchFieldZone, number> = {
      [MatchFieldZone.BOX]: 0.32,
      [MatchFieldZone.ATTACK_THIRD]: 0.3,
      [MatchFieldZone.MIDFIELD]: 0.26,
      [MatchFieldZone.DEFENSE_THIRD]: 0.22,
    };
    const blockedChanceByZone: Record<MatchFieldZone, number> = {
      [MatchFieldZone.BOX]: 0.41,
      [MatchFieldZone.ATTACK_THIRD]: 0.37,
      [MatchFieldZone.MIDFIELD]: 0.33,
      [MatchFieldZone.DEFENSE_THIRD]: 0.28,
    };
    return savedByGoalkeeper
      ? savedChanceByZone[zone] ?? 0.3
      : blockedChanceByZone[zone] ?? 0.35;
  }

  private resolveShootMissOutcome(
    reboundForActingTeam: boolean,
    savedByGoalkeeper: boolean,
  ): MatchActionOutcome {
    if (savedByGoalkeeper) {
      return reboundForActingTeam
        ? MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR
        : MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST;
    }

    return reboundForActingTeam
      ? MatchActionOutcome.SHOOT_BLOCKED_REBOUND_FOR
      : MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST;
  }

  private pickReceiver(players: TeamPlayer[], fromPlayer: TeamPlayer, zone: MatchFieldZone): TeamPlayer {
    const candidates = players.filter((player) => player.playerId !== fromPlayer.playerId);
    const pool = candidates.length ? candidates : players;
    if (!pool.length) {
      return fromPlayer;
    }

    const weighted = pool.map((player) => ({
      player,
      weight: this.computeReceiverWeight(player, zone),
    }));
    return this.pickWeightedPlayer(weighted) || pool[0];
  }

  private pickDefender(players: TeamPlayer[]): TeamPlayer {
    if (!players.length) {
      return this.fallbackPlayer({
        playerId: 'fallback',
        name: 'Fallback Player',
        position: 'DF',
        shirtNumber: 0,
        age: 24,
        skill: 60,
        attack: 60,
        defense: 60,
        energy: 60,
      });
    }

    const weighted = players.map((player) => ({
      player,
      weight: this.computeDefenderWeight(player),
    }));
    return this.pickWeightedPlayer(weighted) || players[0];
  }

  private pickGoalkeeper(players: TeamPlayer[]): TeamPlayer | null {
    return players.find((player) => player.position === 'GK') || null;
  }

  private computeReceiverWeight(player: TeamPlayer, zone: MatchFieldZone): number {
    const base = player.skill * 0.55 + player.attack * 0.25 + player.energy * 0.2;
    const isFw = FORWARD_POSITIONS.has(player.position);
    const isMf = MID_POSITIONS.has(player.position);
    const isDef = DEFENSIVE_POSITIONS.has(player.position);

    switch (zone) {
      case MatchFieldZone.BOX:
        return base * (isFw ? 1.45 : isMf ? 1.15 : 0.75);
      case MatchFieldZone.ATTACK_THIRD:
        return base * (isFw ? 1.3 : isMf ? 1.15 : 0.82);
      case MatchFieldZone.MIDFIELD:
        return base * (isMf ? 1.25 : isFw ? 1.05 : 0.95);
      case MatchFieldZone.DEFENSE_THIRD:
        return base * (isDef ? 1.28 : isMf ? 1.05 : 0.8);
      default:
        return base;
    }
  }

  private computeDefenderWeight(player: TeamPlayer): number {
    const positionBonus = player.position === 'DF' ? 1.22 : player.position === 'GK' ? 1.18 : 1;
    return (player.defense * 0.65 + player.skill * 0.2 + player.energy * 0.15) * positionBonus;
  }

  private computeAttackerScore(
    fromPlayer: TeamPlayer,
    toPlayer: TeamPlayer,
    action: MatchAction,
  ): number {
    switch (action) {
      case MatchAction.PASS:
        return fromPlayer.skill * 0.55 + toPlayer.skill * 0.25 + fromPlayer.energy * 0.2;
      case MatchAction.LONG_PASS:
        return fromPlayer.skill * 0.48 + toPlayer.attack * 0.3 + fromPlayer.energy * 0.22;
      case MatchAction.DRIBBLE:
        return fromPlayer.attack * 0.45 + fromPlayer.skill * 0.35 + fromPlayer.energy * 0.2;
      default:
        return fromPlayer.skill;
    }
  }

  private computeDefenderScore(player: TeamPlayer, zone: MatchFieldZone, includeGoalkeeperBonus: boolean): number {
    const zoneMultiplier =
      zone === MatchFieldZone.BOX ? 1.15 : zone === MatchFieldZone.ATTACK_THIRD ? 1.08 : 1;
    const goalkeeperBonus = includeGoalkeeperBonus && player.position === 'GK' ? 1.12 : 1;
    return (player.defense * 0.62 + player.skill * 0.25 + player.energy * 0.13) * zoneMultiplier * goalkeeperBonus;
  }

  private pickWeightedPlayer(
    weighted: Array<{ player: TeamPlayer; weight: number }>,
  ): TeamPlayer | null {
    const safe = weighted.filter((item) => item.weight > 0);
    if (!safe.length) {
      return null;
    }

    const totalWeight = safe.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.random() * totalWeight;
    for (const item of safe) {
      roll -= item.weight;
      if (roll <= 0) {
        return item.player;
      }
    }

    return safe[safe.length - 1].player;
  }

}
