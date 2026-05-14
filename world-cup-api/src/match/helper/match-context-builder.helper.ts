import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { TeamsService } from 'src/teams/teams.service';
import {
  BuildMatchCurrentContextParams,
  MatchContextBuilderHelperContract,
} from '../interfaces/match-context-builder.interface';
import { MatchCurrentContext } from '../interfaces/match-current-context.interface';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import {
  resolveActionsForEventAndPossession,
  resolveEventMatrixEntry,
} from '../model/match-event-matrix.model';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

type PositionKey = 'GK' | 'DF' | 'MF' | 'FW';

interface ZoneSelectionOptions {
  formation?: MatchFormation | null;
  recentActorId?: string | null;
}

@Injectable()
/**
 * Builds an explicit per-turn context object used by the match engine.
 * This helper centralizes turn-state assembly so MatchService can orchestrate
 * the flow with less implicit coupling.
 */
export class MatchContextBuilderHelper
  extends AbstractMatchBasicHelper
  implements MatchContextBuilderHelperContract
{
  constructor(private readonly teamsService: TeamsService) {
    super();
  }

  getActionPoolForTurn(
    eventType: MatchEventType,
    possession: MatchPossession,
    actionsByEvent: Record<MatchEventType, MatchAction[]>,
  ): MatchAction[] {
    return this.resolveActionPoolForTurn(eventType, possession, actionsByEvent);
  }

  getAvailableActions(
    eventType: MatchEventType,
    zone: MatchFieldZone,
    possession: MatchPossession,
    actionsByEvent: Record<MatchEventType, MatchAction[]>,
  ): MatchAction[] {
    if (eventType === MatchEventType.FORFEIT_EVENT || eventType === MatchEventType.END) {
      return [];
    }

    if (eventType === MatchEventType.HALF_TIME_EVENT) {
      return [MatchAction.RESTART_MATCH, MatchAction.QUIT_MATCH];
    }

    if (this.isPerspectiveLockedEvent(eventType)) {
      return this.resolveActionPoolForTurn(eventType, MatchPossession.USER, actionsByEvent);
    }

    if (possession === MatchPossession.USER) {
      const attackingPool = this.resolveActionPoolForTurn(
        MatchEventType.BALL_POSSESSION_EVENT,
        MatchPossession.USER,
        actionsByEvent,
      );
      return this.applyZoneActionConstraints(
        MatchEventType.BALL_POSSESSION_EVENT,
        MatchPossession.USER,
        zone,
        attackingPool,
      );
    }

    const defensivePool = this.resolveActionPoolForTurn(
      MatchEventType.DEFENSE_EVENT,
      MatchPossession.USER,
      actionsByEvent,
    );
    const defensivePriority = this.resolveDefensiveZonePriority(zone);
    const defensiveFiltered = defensivePriority.filter((action) => defensivePool.includes(action));
    if (defensiveFiltered.length >= 3) {
      return defensiveFiltered;
    }

    const merged = [...defensiveFiltered];
    for (const action of defensivePool) {
      if (!merged.includes(action)) {
        merged.push(action);
      }
    }

    return merged.length ? merged : defensivePool;
  }

  async buildContext(params: BuildMatchCurrentContextParams): Promise<MatchCurrentContext> {
    const eventType = this.parseEventType(params.eventType);
    const zone = this.parseZone(params.zone);
    const possession = this.parsePossession(params.possession);

    const userPlayers = params.userPlayers ?? [];
    const opponentPlayers = params.opponentPlayers ?? [];

    const actingTeamId = possession === MatchPossession.USER ? params.match.teamId : params.match.opponentId;
    const actingTeamName =
      possession === MatchPossession.USER ? params.match.teamName : params.match.opponentName;
    const defendingTeamId = possession === MatchPossession.USER ? params.match.opponentId : params.match.teamId;
    const defendingTeamName =
      possession === MatchPossession.USER ? params.match.opponentName : params.match.teamName;

    const teammatesInZone = this.getPlayersByZone(
      possession === MatchPossession.USER ? userPlayers : opponentPlayers,
      zone,
      true,
      {
        formation:
          possession === MatchPossession.USER
            ? params.tacticalSnapshot.teamFormation
            : params.tacticalSnapshot.opponentFormation,
        recentActorId: params.actingPlayer?.playerId || null,
      },
    );
    const opponentsInZone = this.getPlayersByZone(
      possession === MatchPossession.USER ? opponentPlayers : userPlayers,
      zone,
      false,
      {
        formation:
          possession === MatchPossession.USER
            ? params.tacticalSnapshot.opponentFormation
            : params.tacticalSnapshot.teamFormation,
        recentActorId: params.actingPlayer?.playerId || null,
      },
    );

    const isRivalryMatch = await this.teamsService.areTeamsRivals(
      params.match.teamId,
      params.match.opponentId,
    );

    const actionsByEvent = params.actionsByEvent || this.buildFallbackActionsByEvent();
    const availableActions =
      params.availableActions ||
      this.getAvailableActions(eventType, zone, possession, actionsByEvent);

    return {
      matchId: params.match.matchId,
      turn: params.match.turn,
      minute: params.match.minute,
      eventType,
      zone,
      possession,
      userTeamId: params.match.teamId,
      userTeamName: params.match.teamName,
      opponentTeamId: params.match.opponentId,
      opponentTeamName: params.match.opponentName,
      actingTeamId,
      actingTeamName,
      defendingTeamId,
      defendingTeamName,
      actingPlayer: params.actingPlayer,
      teammatesInZone,
      opponentsInZone,
      actingOnFieldCount: possession === MatchPossession.USER ? userPlayers.length : opponentPlayers.length,
      defendingOnFieldCount: possession === MatchPossession.USER ? opponentPlayers.length : userPlayers.length,
      tacticalSnapshot: params.tacticalSnapshot,
      availableActions,
      isPendingSetPiece: params.isPendingSetPiece,
      isRivalryMatch,
      lastAction: params.lastAction,
      lastOutcome: params.lastOutcome,
    };
  }

  private parseEventType(value: string): MatchEventType {
    const normalized = value as MatchEventType;
    if (Object.values(MatchEventType).includes(normalized)) {
      return normalized;
    }

    return MatchEventType.BALL_POSSESSION_EVENT;
  }

  private parseZone(value: string): MatchFieldZone {
    const normalized = value as MatchFieldZone;
    if (Object.values(MatchFieldZone).includes(normalized)) {
      return normalized;
    }

    return MatchFieldZone.MIDFIELD;
  }

  private parsePossession(value: string): MatchPossession {
    const normalized = value as MatchPossession;
    if (Object.values(MatchPossession).includes(normalized)) {
      return normalized;
    }

    return MatchPossession.USER;
  }

  private buildFallbackActionsByEvent(): Record<MatchEventType, MatchAction[]> {
    return Object.values(MatchEventType).reduce(
      (accumulator, eventType) => {
        const entry = resolveEventMatrixEntry(eventType);
        const merged = [...entry.userActions, ...entry.opponentActions];
        accumulator[eventType] = Array.from(new Set(merged));
        return accumulator;
      },
      {} as Record<MatchEventType, MatchAction[]>,
    );
  }

  private resolveActionPoolForTurn(
    eventType: MatchEventType,
    possession: MatchPossession,
    actionsByEvent: Record<MatchEventType, MatchAction[]>,
  ): MatchAction[] {
    const basePool = resolveActionsForEventAndPossession(eventType, possession);
    const fallbackPool = resolveActionsForEventAndPossession(
      MatchEventType.BALL_POSSESSION_EVENT,
      possession,
    );
    if (!basePool.length) {
      return fallbackPool;
    }

    const eventPool = actionsByEvent[eventType];
    if (!eventPool?.length) {
      return basePool;
    }

    const constrained = eventPool.filter((action) => basePool.includes(action));
    return constrained.length >= 3 ? constrained : basePool;
  }

  private applyZoneActionConstraints(
    eventType: MatchEventType,
    possession: MatchPossession,
    zone: MatchFieldZone,
    actions: MatchAction[],
  ): MatchAction[] {
    if (possession !== MatchPossession.USER || eventType !== MatchEventType.BALL_POSSESSION_EVENT) {
      return actions;
    }

    const zonePriority = this.resolveBallPossessionZonePriority(zone);
    const zoneFiltered = zonePriority.filter((action) => actions.includes(action));
    if (zoneFiltered.length >= 3) {
      return zoneFiltered;
    }

    const fallback = resolveActionsForEventAndPossession(
      MatchEventType.BALL_POSSESSION_EVENT,
      MatchPossession.USER,
    );
    const fallbackFiltered = zonePriority.filter((action) => fallback.includes(action));
    const merged = [...zoneFiltered];
    for (const action of fallbackFiltered) {
      if (!merged.includes(action)) {
        merged.push(action);
      }
    }

    return merged.length ? merged : actions;
  }

  private resolveBallPossessionZonePriority(zone: MatchFieldZone): MatchAction[] {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return [MatchAction.PASS, MatchAction.LONG_PASS, MatchAction.HOLD, MatchAction.DRIBBLE];
      case MatchFieldZone.MIDFIELD:
        return [MatchAction.PASS, MatchAction.DRIBBLE, MatchAction.LONG_PASS, MatchAction.HOLD, MatchAction.ATTACK];
      case MatchFieldZone.ATTACK_THIRD:
        return [
          MatchAction.ATTACK,
          MatchAction.DRIBBLE,
          MatchAction.PASS,
          MatchAction.CROSS,
          MatchAction.SHOOT,
          MatchAction.LONG_PASS,
        ];
      case MatchFieldZone.BOX:
        return [MatchAction.SHOOT, MatchAction.DRIBBLE, MatchAction.ATTACK, MatchAction.PASS, MatchAction.CROSS];
      default:
        return [MatchAction.PASS, MatchAction.DRIBBLE, MatchAction.LONG_PASS, MatchAction.HOLD];
    }
  }

  private resolveDefensiveZonePriority(zone: MatchFieldZone): MatchAction[] {
    switch (zone) {
      case MatchFieldZone.BOX:
        return [MatchAction.BLOCK, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.PRESS];
      case MatchFieldZone.DEFENSE_THIRD:
        return [MatchAction.DEFEND, MatchAction.BLOCK, MatchAction.TACKLE, MatchAction.PRESS];
      case MatchFieldZone.MIDFIELD:
        return [MatchAction.PRESS, MatchAction.TACKLE, MatchAction.DEFEND, MatchAction.BLOCK];
      case MatchFieldZone.ATTACK_THIRD:
        return [MatchAction.PRESS, MatchAction.TACKLE, MatchAction.DEFEND, MatchAction.BLOCK];
      default:
        return [MatchAction.PRESS, MatchAction.DEFEND, MatchAction.TACKLE, MatchAction.BLOCK];
    }
  }

  private isPerspectiveLockedEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.PENALTY_FOR_EVENT ||
      eventType === MatchEventType.PENALTY_AGAINST_EVENT ||
      eventType === MatchEventType.FREE_KICK_FOR_EVENT ||
      eventType === MatchEventType.FREE_KICK_AGAINST_EVENT ||
      eventType === MatchEventType.CORNER_FOR_EVENT ||
      eventType === MatchEventType.CORNER_AGAINST_EVENT ||
      eventType === MatchEventType.THROW_IN_FOR_EVENT ||
      eventType === MatchEventType.THROW_IN_AGAINST_EVENT ||
      eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT ||
      eventType === MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT
    );
  }

  /**
   * Returns a simple zone-oriented subset of on-field players.
   * It does not simulate exact x/y positioning; it only provides
   * nearby role groups to drive context-based probabilities.
   */
  getPlayersByZone(
    players: TeamPlayer[],
    zone: MatchFieldZone,
    isActingTeam: boolean,
    options?: ZoneSelectionOptions,
  ): TeamPlayer[] {
    const byPosition = this.groupByPosition(players);
    const pick = (position: PositionKey, count: number): TeamPlayer[] =>
      this.pickWeightedByPosition({
        players: byPosition[position],
        count,
        zone,
        position,
        formation: options?.formation || null,
        isActingTeam,
        recentActorId: options?.recentActorId || null,
      });

    const baseQuotas = this.resolveZoneQuotas(zone, isActingTeam);
    const quotas = this.applyFormationBiasToQuotas({
      baseQuotas,
      zone,
      isActingTeam,
      formation: options?.formation || null,
    });
    let selection: TeamPlayer[] = [
      ...pick('GK', quotas.gk),
      ...pick('DF', quotas.df),
      ...pick('MF', quotas.mf),
      ...pick('FW', quotas.fw),
    ];

    if (zone === MatchFieldZone.BOX && isActingTeam) {
      const hasPrimaryAttackers = selection.some(
        (player) => player.position === 'FW' || player.position === 'MF',
      );
      if (!hasPrimaryAttackers) {
        selection = [...pick('DF', 2), ...pick('GK', 1)];
      }
    }

    const unique = new Map(selection.map((player) => [player.playerId, player]));
    return Array.from(unique.values());
  }

  private groupByPosition(players: TeamPlayer[]): Record<string, TeamPlayer[]> {
    const grouped: Record<string, TeamPlayer[]> = {
      GK: [],
      DF: [],
      MF: [],
      FW: [],
    };

    for (const player of players) {
      const normalized = this.normalizePosition(player.position);
      grouped[normalized].push(player);
    }

    return grouped;
  }

  private pickWeightedByPosition(params: {
    players: TeamPlayer[];
    count: number;
    zone: MatchFieldZone;
    position: PositionKey;
    formation: MatchFormation | null;
    isActingTeam: boolean;
    recentActorId: string | null;
  }): TeamPlayer[] {
    const { players, count } = params;
    if (!players.length || count <= 0) {
      return [];
    }

    if (players.length <= count) {
      return [...players];
    }

    const pool = [...players];
    const selected: TeamPlayer[] = [];
    while (pool.length && selected.length < count) {
      const weighted = pool.map((player) => ({
        player,
        weight: this.computeZonePlayerWeight(player, params),
      }));
      const picked = this.pickWeightedPlayer(weighted);
      if (!picked) {
        break;
      }
      selected.push(picked);
      const index = pool.findIndex((candidate) => candidate.playerId === picked.playerId);
      if (index >= 0) {
        pool.splice(index, 1);
      }
    }

    if (selected.length < count) {
      for (const candidate of pool) {
        if (selected.length >= count) {
          break;
        }
        selected.push(candidate);
      }
    }

    return selected;
  }

  private computeZonePlayerWeight(
    player: TeamPlayer,
    params: {
      zone: MatchFieldZone;
      position: PositionKey;
      formation: MatchFormation | null;
      isActingTeam: boolean;
      recentActorId: string | null;
    },
  ): number {
    const formationWeight = this.resolveFormationPositionWeight(params.formation, params.position);
    const zoneRoleWeight = this.resolveZoneRoleWeight({
      zone: params.zone,
      position: params.position,
      isActingTeam: params.isActingTeam,
    });
    const roleStat = params.isActingTeam
      ? params.zone === MatchFieldZone.BOX || params.zone === MatchFieldZone.ATTACK_THIRD
        ? player.attack
        : player.skill
      : player.defense;
    const repeatedActorPenalty =
      params.recentActorId && player.playerId === params.recentActorId ? 0.62 : 1;
    const noise = 0.94 + this.random() * 0.12;
    const base = player.skill * 0.5 + player.energy * 0.25 + roleStat * 0.25;
    return base * formationWeight * zoneRoleWeight * repeatedActorPenalty * noise;
  }

  private resolveFormationPositionWeight(
    formation: MatchFormation | null,
    position: PositionKey,
  ): number {
    if (!formation || position === 'GK') {
      return 1;
    }

    const distribution = this.parseFormationDistribution(formation);
    if (!distribution) {
      return 1;
    }

    switch (position) {
      case 'DF':
        return this.clamp(distribution.df / 4, 0.78, 1.28);
      case 'MF':
        return this.clamp(distribution.mf / 4, 0.75, 1.35);
      case 'FW':
        return this.clamp(distribution.fw / 2, 0.72, 1.55);
      default:
        return 1;
    }
  }

  private resolveZoneRoleWeight(params: {
    zone: MatchFieldZone;
    position: PositionKey;
    isActingTeam: boolean;
  }): number {
    const { zone, position, isActingTeam } = params;
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        if (isActingTeam) {
          return position === 'GK' || position === 'DF' ? 1.18 : position === 'MF' ? 1.04 : 0.84;
        }
        return position === 'FW' ? 1.2 : position === 'MF' ? 1.06 : 0.95;
      case MatchFieldZone.MIDFIELD:
        return position === 'MF' ? 1.22 : position === 'DF' || position === 'FW' ? 1.02 : 0.82;
      case MatchFieldZone.ATTACK_THIRD:
        if (isActingTeam) {
          return position === 'FW' ? 1.24 : position === 'MF' ? 1.08 : 0.86;
        }
        return position === 'DF' ? 1.2 : position === 'MF' ? 1.08 : position === 'GK' ? 1.04 : 0.8;
      case MatchFieldZone.BOX:
        if (isActingTeam) {
          return position === 'FW' ? 1.28 : position === 'MF' ? 1.12 : 0.72;
        }
        return position === 'GK' ? 1.28 : position === 'DF' ? 1.22 : position === 'MF' ? 1.02 : 0.72;
      default:
        return 1;
    }
  }

  private parseFormationDistribution(formation: MatchFormation): {
    df: number;
    mf: number;
    fw: number;
  } | null {
    const segments = String(formation)
      .split('-')
      .map((segment) => Number(segment))
      .filter((segment) => Number.isFinite(segment) && segment > 0);

    if (segments.length < 3) {
      return null;
    }

    const df = segments[0];
    const fw = segments[segments.length - 1];
    const mf = segments.slice(1, -1).reduce((sum, value) => sum + value, 0);

    if (!df || !mf || !fw) {
      return null;
    }

    return { df, mf, fw };
  }

  private resolveZoneQuotas(
    zone: MatchFieldZone,
    isActingTeam: boolean,
  ): { gk: number; df: number; mf: number; fw: number } {
    switch (zone) {
      case MatchFieldZone.DEFENSE_THIRD:
        return isActingTeam
          ? { gk: 1, df: 4, mf: 2, fw: 0 }
          : { gk: 0, df: 2, mf: 3, fw: 2 };
      case MatchFieldZone.MIDFIELD:
        return { gk: 0, df: 2, mf: 4, fw: 2 };
      case MatchFieldZone.ATTACK_THIRD:
        return isActingTeam
          ? { gk: 0, df: 1, mf: 3, fw: 3 }
          : { gk: 1, df: 4, mf: 3, fw: 0 };
      case MatchFieldZone.BOX:
        return isActingTeam
          ? { gk: 0, df: 0, mf: 3, fw: 3 }
          : { gk: 1, df: 4, mf: 2, fw: 0 };
      default:
        return { gk: 1, df: 3, mf: 4, fw: 2 };
    }
  }

  private applyFormationBiasToQuotas(params: {
    baseQuotas: { gk: number; df: number; mf: number; fw: number };
    zone: MatchFieldZone;
    isActingTeam: boolean;
    formation: MatchFormation | null;
  }): { gk: number; df: number; mf: number; fw: number } {
    const { baseQuotas, zone, isActingTeam, formation } = params;
    if (!formation || !isActingTeam) {
      return baseQuotas;
    }

    if (zone !== MatchFieldZone.ATTACK_THIRD && zone !== MatchFieldZone.BOX && zone !== MatchFieldZone.MIDFIELD) {
      return baseQuotas;
    }

    const distribution = this.parseFormationDistribution(formation);
    if (!distribution) {
      return baseQuotas;
    }

    const outfieldTotal = baseQuotas.df + baseQuotas.mf + baseQuotas.fw;
    if (outfieldTotal <= 0) {
      return baseQuotas;
    }

    let df = baseQuotas.df;
    let mf = baseQuotas.mf;
    let fw = baseQuotas.fw;

    if (zone === MatchFieldZone.ATTACK_THIRD || zone === MatchFieldZone.BOX) {
      const fixedDf = zone === MatchFieldZone.ATTACK_THIRD ? Math.min(2, Math.max(0, df)) : 0;
      const attackingSlots = outfieldTotal - fixedDf;
      const offensiveShare = distribution.fw / Math.max(1, distribution.fw + distribution.mf);
      const weightedOffensiveShare = this.clamp(offensiveShare * 1.18, 0.22, 0.78);
      fw = Math.round(attackingSlots * weightedOffensiveShare);
      mf = attackingSlots - fw;
      df = fixedDf;

      if (zone === MatchFieldZone.ATTACK_THIRD) {
        fw = Math.max(2, fw);
      } else {
        fw = Math.max(1, fw);
      }
    } else if (zone === MatchFieldZone.MIDFIELD) {
      const lineTotal = distribution.df + distribution.mf + distribution.fw;
      const targetMf = Math.round((outfieldTotal * distribution.mf) / lineTotal);
      mf = Math.round(baseQuotas.mf * 0.4 + targetMf * 0.6);
      const remaining = Math.max(0, outfieldTotal - mf);
      const defenderShare = distribution.df / Math.max(1, distribution.df + distribution.fw);
      df = Math.round(remaining * defenderShare);
      fw = remaining - df;
      mf = Math.max(3, mf);
    } else {
      const lineTotal = distribution.df + distribution.mf + distribution.fw;
      const targetDf = Math.round((outfieldTotal * distribution.df) / lineTotal);
      const targetMf = Math.round((outfieldTotal * distribution.mf) / lineTotal);
      const targetFw = Math.max(0, outfieldTotal - targetDf - targetMf);
      df = Math.round(baseQuotas.df * 0.45 + targetDf * 0.55);
      mf = Math.round(baseQuotas.mf * 0.45 + targetMf * 0.55);
      fw = Math.round(baseQuotas.fw * 0.45 + targetFw * 0.55);
    }

    ({ df, mf, fw } = this.rebalanceOutfieldCounts({ df, mf, fw }, outfieldTotal));

    if (zone === MatchFieldZone.ATTACK_THIRD && fw < 2) {
      fw = 2;
      ({ df, mf, fw } = this.rebalanceOutfieldCounts({ df, mf, fw }, outfieldTotal));
    }

    if (zone === MatchFieldZone.BOX && fw < 1) {
      fw = 1;
      ({ df, mf, fw } = this.rebalanceOutfieldCounts({ df, mf, fw }, outfieldTotal));
    }

    return {
      gk: baseQuotas.gk,
      df,
      mf,
      fw,
    };
  }

  private rebalanceOutfieldCounts(
    counts: { df: number; mf: number; fw: number },
    expectedTotal: number,
  ): { df: number; mf: number; fw: number } {
    let df = Math.max(0, counts.df);
    let mf = Math.max(0, counts.mf);
    let fw = Math.max(0, counts.fw);
    const roleOrder: Array<'DF' | 'MF' | 'FW'> = ['MF', 'FW', 'DF'];

    while (df + mf + fw < expectedTotal) {
      for (const role of roleOrder) {
        if (df + mf + fw >= expectedTotal) {
          break;
        }
        if (role === 'DF') {
          df += 1;
        } else if (role === 'MF') {
          mf += 1;
        } else {
          fw += 1;
        }
      }
    }

    while (df + mf + fw > expectedTotal) {
      if (mf > fw && mf > df) {
        mf -= 1;
      } else if (fw > df) {
        fw -= 1;
      } else {
        df -= 1;
      }
    }

    return { df, mf, fw };
  }

  private pickWeightedPlayer(
    weighted: Array<{ player: TeamPlayer; weight: number }>,
  ): TeamPlayer | null {
    const safe = weighted.filter((item) => item.weight > 0);
    if (!safe.length) {
      return null;
    }

    const total = safe.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.random() * total;
    for (const item of safe) {
      roll -= item.weight;
      if (roll <= 0) {
        return item.player;
      }
    }

    return safe[safe.length - 1].player;
  }

  private normalizePosition(position: string): 'GK' | 'DF' | 'MF' | 'FW' {
    const upper = (position || '').toUpperCase();

    if (upper === 'GK') {
      return 'GK';
    }

    if (upper === 'DF') {
      return 'DF';
    }

    if (upper === 'MF') {
      return 'MF';
    }

    return 'FW';
  }
}
