import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService, TranslationParams } from 'src/i18n/i18n.service';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { MatchSquadEntity } from '../entity/match-squad.entity';
import { MatchStatEntity } from '../entity/match-stat.entity';
import { MatchAction } from '../model/match-action.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFormation } from '../model/match-formation.enum';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchStrategy } from '../model/match-strategy.enum';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

interface MatchStatRecordParams {
  matchId: string;
  minute: number;
  turn: number;
  eventType: MatchEventType;
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
}

export interface SquadTurnIncidentMessage {
  type: MatchMessageType.SUBSTITUTION | MatchMessageType.INJURY | MatchMessageType.INFO;
  en: string;
  es: string;
  minute: number;
  turn: number;
  teamId: string;
  teamName: string;
  playerName?: string | null;
}

@Injectable()
/**
 * Encapsulates squad lifecycle rules:
 * starters, cards impact, fatigue decay, auto substitutions and injury risk.
 */
export class MatchSquadRulesHelper extends AbstractMatchBasicHelper {
  constructor(
    @InjectRepository(MatchSquadEntity)
    private readonly matchSquadRepository: Repository<MatchSquadEntity>,
    @InjectRepository(MatchStatEntity)
    private readonly matchStatRepository: Repository<MatchStatEntity>,
    private readonly i18nService: I18nService,
  ) {
    super();
  }

  /**
   * Creates one persisted squad snapshot for the match/team if it does not already exist.
   */
  async initializeMatchSquad(
    matchId: string,
    teamId: string,
    captainName: string,
    teamPlayers: TeamPlayer[],
    formation: MatchFormation | null,
    strategy: MatchStrategy | null,
  ): Promise<void> {
    const existing = await this.matchSquadRepository.count({ where: { matchId, teamId } });
    if (existing > 0) {
      return;
    }

    const starterIds = this.pickInitialStarters(teamPlayers, captainName, formation, strategy);
    const normalizedCaptain = captainName.trim().toLowerCase();

    const rows = this.matchSquadRepository.create(
      teamPlayers.map((player) => ({
        matchId,
        teamId,
        playerId: player.playerId,
        playerName: player.name,
        position: player.position,
        shirtNumber: player.shirtNumber,
        age: player.age,
        skill: player.skill,
        attack: player.attack,
        defense: player.defense,
        energy: player.energy,
        isCaptain: player.name.trim().toLowerCase() === normalizedCaptain,
        isStarter: starterIds.has(player.playerId),
        isOnField: starterIds.has(player.playerId),
        yellowCards: 0,
        redCard: false,
        isInjured: false,
      })),
    );

    await this.matchSquadRepository.save(rows);
  }

  /**
   * Returns currently available on-field players for a team/match.
   */
  async getMatchOnFieldPlayers(matchId: string, teamId: string): Promise<TeamPlayer[]> {
    const rows = await this.matchSquadRepository.find({
      where: { matchId, teamId, isOnField: true, redCard: false, isInjured: false },
      order: { position: 'ASC', playerName: 'ASC' },
    });

    return rows.map((row) => ({
      playerId: row.playerId,
      name: row.playerName,
      position: row.position,
      shirtNumber: row.shirtNumber,
      age: row.age,
      skill: row.skill,
      attack: row.attack,
      defense: row.defense,
      energy: row.energy,
      isCaptain: row.isCaptain,
    }));
  }

  /**
   * Applies yellow card marker to one squad player.
   */
  async applyYellowCardToSquadPlayer(
    matchId: string,
    teamId: string,
    playerId: string,
  ): Promise<MatchCardType> {
    const row = await this.matchSquadRepository.findOne({ where: { matchId, teamId, playerId } });
    if (!row) {
      return MatchCardType.YELLOW;
    }

    row.yellowCards += 1;

    if (row.yellowCards >= 2) {
      const sentOff = await this.trySendOffPlayer(matchId, teamId, row);
      if (sentOff) {
        return MatchCardType.RED;
      }
    }

    await this.matchSquadRepository.save(row);
    return MatchCardType.YELLOW;
  }

  /**
   * Applies red card marker and removes the player if team still has more than 7 players.
   */
  async applyRedCardToSquadPlayer(matchId: string, teamId: string, playerId: string): Promise<boolean> {
    const row = await this.matchSquadRepository.findOne({ where: { matchId, teamId, playerId } });
    if (!row) {
      return false;
    }

    return this.trySendOffPlayer(matchId, teamId, row);
  }

  /**
   * Applies effective red-card removal constraints and persists send-off.
   */
  private async trySendOffPlayer(
    matchId: string,
    teamId: string,
    row: MatchSquadEntity,
  ): Promise<boolean> {
    // Goalkeepers are protected from direct red-card removal in this engine.
    if (row.position === 'GK') {
      return false;
    }

    const onFieldCount = await this.countOnFieldPlayers(matchId, teamId);
    if (onFieldCount <= 7) {
      return false;
    }

    row.redCard = true;
    row.isOnField = false;
    await this.matchSquadRepository.save(row);
    return true;
  }

  /**
   * Applies per-turn energy decay and then executes substitutions/injury rules.
   */
  async applyFatigueAndSquadRules(
    match: MatchEntity,
    params: { minute: number; actingPlayerId: string; eventType: MatchEventType },
  ): Promise<SquadTurnIncidentMessage[]> {
    const incidents: SquadTurnIncidentMessage[] = [];
    const onFieldRows = await this.matchSquadRepository.find({
      where: { matchId: match.matchId, isOnField: true, redCard: false, isInjured: false },
    });

    for (const row of onFieldRows) {
      const baseDecay = this.randomInt(2, 5);
      const actionDecay = row.playerId === params.actingPlayerId ? this.randomInt(2, 4) : 0;
      row.energy = Math.max(10, row.energy - baseDecay - actionDecay);
    }

    await this.matchSquadRepository.save(onFieldRows);

    incidents.push(
      ...(await this.applyAutoSubstitutionsForTeam(match, match.teamId, match.teamName, true, params)),
    );
    incidents.push(
      ...(await this.applyAutoSubstitutionsForTeam(
        match,
        match.opponentId,
        match.opponentName,
        false,
        params,
      )),
    );

    incidents.push(
      ...(await this.applyLowEnergyInjuryRisk(match, match.teamId, match.teamName, params)),
    );
    incidents.push(
      ...(await this.applyLowEnergyInjuryRisk(match, match.opponentId, match.opponentName, params)),
    );

    const userCaptainIncident = await this.ensureTeamCaptainOnField(match, {
      teamId: match.teamId,
      teamName: match.teamName,
      minute: params.minute,
      turn: match.turn,
      eventType: params.eventType,
    });
    if (userCaptainIncident) {
      incidents.push(userCaptainIncident);
    }

    const opponentCaptainIncident = await this.ensureTeamCaptainOnField(match, {
      teamId: match.opponentId,
      teamName: match.opponentName,
      minute: params.minute,
      turn: match.turn,
      eventType: params.eventType,
    });
    if (opponentCaptainIncident) {
      incidents.push(opponentCaptainIncident);
    }

    return incidents;
  }

  /**
   * Picks best XI based on formation + strategy while forcing captain and one goalkeeper.
   */
  private pickInitialStarters(
    teamPlayers: TeamPlayer[],
    captainName: string,
    formation: MatchFormation | null,
    strategy: MatchStrategy | null,
  ): Set<string> {
    const starters = new Set<string>();
    if (!teamPlayers.length) {
      return starters;
    }

    const normalizedCaptain = captainName.trim().toLowerCase();
    const captain = teamPlayers.find((player) => player.name.trim().toLowerCase() === normalizedCaptain);
    const maxStarters = Math.min(11, teamPlayers.length);

    const gkPool = teamPlayers.filter((player) => player.position === 'GK');
    if (gkPool.length > 0) {
      const selectedGk = [...gkPool].sort((a, b) => this.roleScore(b, strategy) - this.roleScore(a, strategy))[0];
      starters.add(selectedGk.playerId);
    }

    const targets = this.resolveOutfieldTargets(formation);
    const outfieldPool = teamPlayers.filter((player) => player.position !== 'GK');

    const defenders = outfieldPool
      .filter((player) => player.position === 'DF')
      .sort((a, b) => this.roleScore(b, strategy, 'DF') - this.roleScore(a, strategy, 'DF'));
    const midfielders = outfieldPool
      .filter((player) => player.position === 'MF')
      .sort((a, b) => this.roleScore(b, strategy, 'MF') - this.roleScore(a, strategy, 'MF'));
    const forwards = outfieldPool
      .filter((player) => player.position === 'FW')
      .sort((a, b) => this.roleScore(b, strategy, 'FW') - this.roleScore(a, strategy, 'FW'));

    for (const player of defenders.slice(0, targets.df)) {
      if (starters.size < maxStarters) {
        starters.add(player.playerId);
      }
    }
    for (const player of midfielders.slice(0, targets.mf)) {
      if (starters.size < maxStarters) {
        starters.add(player.playerId);
      }
    }
    for (const player of forwards.slice(0, targets.fw)) {
      if (starters.size < maxStarters) {
        starters.add(player.playerId);
      }
    }

    const remaining = teamPlayers
      .filter((player) => !starters.has(player.playerId))
      .sort((a, b) => this.roleScore(b, strategy) - this.roleScore(a, strategy));

    while (starters.size < maxStarters && remaining.length > 0) {
      const picked = remaining.shift();
      if (!picked) {
        break;
      }
      starters.add(picked.playerId);
    }

    if (captain && !starters.has(captain.playerId)) {
      const currentStarterPlayers = teamPlayers.filter((player) => starters.has(player.playerId));
      const removableCandidates = currentStarterPlayers.filter((player) => player.position !== 'GK');
      const removable = [...removableCandidates].sort(
        (a, b) => this.roleScore(a, strategy) - this.roleScore(b, strategy),
      )[0];

      if (removable) {
        starters.delete(removable.playerId);
      }
      if (starters.size < maxStarters || removable) {
        starters.add(captain.playerId);
      }
    }

    return starters;
  }

  /**
   * Applies tactical substitutions for one team when strategy changes.
   * Uses role fit (not energy) to improve the current setup.
   */
  async applyTacticalSubstitutionsForTeam(
    match: MatchEntity,
    params: {
      teamId: string;
      teamName: string;
      strategy: MatchStrategy;
      isUserTeam: boolean;
      minute: number;
      eventType: MatchEventType;
      maxChanges?: number;
    },
  ): Promise<SquadTurnIncidentMessage[]> {
    const incidents: SquadTurnIncidentMessage[] = [];
    const maxChanges = Math.max(1, params.maxChanges || 2);

    for (let changes = 0; changes < maxChanges; changes += 1) {
      const substitutionsUsed = params.isUserTeam ? match.teamSubstitutionsUsed : match.opponentSubstitutionsUsed;
      if (substitutionsUsed >= match.maxSubstitutions) {
        break;
      }

      const onField = await this.matchSquadRepository.find({
        where: {
          matchId: match.matchId,
          teamId: params.teamId,
          isOnField: true,
          redCard: false,
          isInjured: false,
        },
      });
      const bench = await this.matchSquadRepository.find({
        where: {
          matchId: match.matchId,
          teamId: params.teamId,
          isOnField: false,
          redCard: false,
          isInjured: false,
        },
      });

      if (!onField.length || !bench.length) {
        break;
      }

      const outgoingCandidates = onField
        .filter((player) => player.position !== 'GK')
        .sort(
          (a, b) =>
            this.roleScoreFromSnapshot(a, params.strategy, a.position) -
            this.roleScoreFromSnapshot(b, params.strategy, b.position),
        );
      const outgoing = outgoingCandidates[0];
      if (!outgoing) {
        break;
      }

      const incomingPool = bench
        .filter((player) => player.position === outgoing.position)
        .concat(bench.filter((player) => player.position !== outgoing.position));
      const incoming = [...incomingPool].sort(
        (a, b) =>
          this.roleScoreFromSnapshot(b, params.strategy, outgoing.position) -
          this.roleScoreFromSnapshot(a, params.strategy, outgoing.position),
      )[0];
      if (!incoming) {
        break;
      }

      const outgoingScore = this.roleScoreFromSnapshot(outgoing, params.strategy, outgoing.position);
      const incomingScore = this.roleScoreFromSnapshot(incoming, params.strategy, outgoing.position);
      if (incomingScore <= outgoingScore + 4) {
        break;
      }

      outgoing.isOnField = false;
      incoming.isOnField = true;
      incoming.energy = Math.max(incoming.energy, 50);
      await this.matchSquadRepository.save([outgoing, incoming]);

      if (params.isUserTeam) {
        match.teamSubstitutionsUsed += 1;
      } else {
        match.opponentSubstitutionsUsed += 1;
      }

      const substitutionMessageKey = this.chance(0.5)
        ? 'match.timeline.substitution'
        : 'match.timeline.substitution.entersField';
      const substitutionParams = {
        teamName: params.teamName,
        incomingPlayerName: incoming.playerName,
        outgoingPlayerName: outgoing.playerName,
      };
      const substitutionMessageEn = this.i18nService.t(substitutionMessageKey, 'en', substitutionParams);
      const substitutionMessageEs = this.i18nService.t(substitutionMessageKey, 'es', substitutionParams);

      await this.recordMatchStat({
        matchId: match.matchId,
        minute: params.minute,
        turn: match.turn,
        eventType: params.eventType,
        action: null,
        teamId: params.teamId,
        teamName: params.teamName,
        playerName: incoming.playerName,
        playerPosition: incoming.position,
        cardType: null,
        isGoal: false,
        message: substitutionMessageEn,
        messageKey: substitutionMessageKey,
        messageParams: substitutionParams,
      });

      incidents.push({
        type: MatchMessageType.SUBSTITUTION,
        en: substitutionMessageEn,
        es: substitutionMessageEs,
        minute: params.minute,
        turn: match.turn,
        teamId: params.teamId,
        teamName: params.teamName,
        playerName: incoming.playerName,
      });
    }

    const captainIncident = await this.ensureTeamCaptainOnField(match, {
      teamId: params.teamId,
      teamName: params.teamName,
      minute: params.minute,
      turn: match.turn,
      eventType: params.eventType,
    });
    if (captainIncident) {
      incidents.push(captainIncident);
    }

    return incidents;
  }

  /**
   * Performs automatic substitutions for exhausted players when bench and substitutions remain.
   */
  private async applyAutoSubstitutionsForTeam(
    match: MatchEntity,
    teamId: string,
    teamName: string,
    isUserTeam: boolean,
    params: { minute: number; eventType: MatchEventType },
  ): Promise<SquadTurnIncidentMessage[]> {
    const incidents: SquadTurnIncidentMessage[] = [];
    for (;;) {
      const substitutionsUsed = isUserTeam ? match.teamSubstitutionsUsed : match.opponentSubstitutionsUsed;
      if (substitutionsUsed >= match.maxSubstitutions) {
        return incidents;
      }

      const onField = await this.matchSquadRepository.find({
        where: { matchId: match.matchId, teamId, isOnField: true, redCard: false, isInjured: false },
        order: { energy: 'ASC' },
      });

      const outgoing = onField.find((player) => player.energy < 35);
      if (!outgoing) {
        return incidents;
      }

      const bench = await this.matchSquadRepository.find({
        where: { matchId: match.matchId, teamId, isOnField: false, redCard: false, isInjured: false },
        order: { energy: 'DESC' },
      });

      if (!bench.length) {
        return incidents;
      }

      // Goalkeeper can be subbed only by another goalkeeper to keep role consistency.
      const incoming =
        outgoing.position === 'GK'
          ? bench.find((candidate) => candidate.position === 'GK')
          : bench.find((candidate) => candidate.position === outgoing.position) ||
            bench.find((candidate) => candidate.position === 'MF') ||
            bench[0];

      if (!incoming) {
        return incidents;
      }

      outgoing.isOnField = false;
      incoming.isOnField = true;
      incoming.energy = Math.max(incoming.energy, 45);

      await this.matchSquadRepository.save([outgoing, incoming]);

      if (isUserTeam) {
        match.teamSubstitutionsUsed += 1;
      } else {
        match.opponentSubstitutionsUsed += 1;
      }

      const substitutionMessageKey = this.chance(0.5)
        ? 'match.timeline.substitution'
        : 'match.timeline.substitution.entersField';
      const substitutionParams = {
        teamName,
        incomingPlayerName: incoming.playerName,
        outgoingPlayerName: outgoing.playerName,
      };
      const substitutionMessageEn = this.i18nService.t(substitutionMessageKey, 'en', substitutionParams);
      const substitutionMessageEs = this.i18nService.t(substitutionMessageKey, 'es', substitutionParams);

      await this.recordMatchStat({
        matchId: match.matchId,
        minute: params.minute,
        turn: match.turn,
        eventType: params.eventType,
        action: null,
        teamId,
        teamName,
        playerName: incoming.playerName,
        playerPosition: incoming.position,
        cardType: null,
        isGoal: false,
        message: substitutionMessageEn,
        messageKey: substitutionMessageKey,
        messageParams: substitutionParams,
      });

      incidents.push({
        type: MatchMessageType.SUBSTITUTION,
        en: substitutionMessageEn,
        es: substitutionMessageEs,
        minute: params.minute,
        turn: match.turn,
        teamId,
        teamName,
        playerName: incoming.playerName,
      });
    }
  }

  /**
   * Applies injury risk for low-energy players when no substitutions remain.
   */
  private async applyLowEnergyInjuryRisk(
    match: MatchEntity,
    teamId: string,
    teamName: string,
    params: { minute: number; eventType: MatchEventType },
  ): Promise<SquadTurnIncidentMessage[]> {
    const incidents: SquadTurnIncidentMessage[] = [];
    const isUserTeam = teamId === match.teamId;
    const substitutionsUsed = isUserTeam ? match.teamSubstitutionsUsed : match.opponentSubstitutionsUsed;
    const hasNoSubsRemaining = substitutionsUsed >= match.maxSubstitutions;

    let onField = await this.matchSquadRepository.find({
      where: { matchId: match.matchId, teamId, isOnField: true, redCard: false, isInjured: false },
      order: { energy: 'ASC' },
    });

    for (const player of onField) {
      // Goalkeepers are excluded from low-energy injury removals.
      if (player.position === 'GK') {
        continue;
      }

      const currentOnField = onField.filter((item) => item.isOnField).length;
      if (currentOnField <= 7) {
        return incidents;
      }

      const injuryChance = this.resolveInjuryChance(player.energy, player.age, hasNoSubsRemaining);
      if (!this.chance(injuryChance)) {
        continue;
      }

      player.isInjured = true;
      player.isOnField = false;
      await this.matchSquadRepository.save(player);

      const injuryMessageEn = this.i18nService.t('match.timeline.injury', 'en', {
        playerName: player.playerName,
      });
      const injuryMessageEs = this.i18nService.t('match.timeline.injury', 'es', {
        playerName: player.playerName,
      });

      await this.recordMatchStat({
        matchId: match.matchId,
        minute: params.minute,
        turn: match.turn,
        eventType: params.eventType,
        action: null,
        teamId,
        teamName,
        playerName: player.playerName,
        playerPosition: player.position,
        cardType: null,
        isGoal: false,
        message: injuryMessageEn,
        messageKey: 'match.timeline.injury',
        messageParams: {
          playerName: player.playerName,
        },
      });

      incidents.push({
        type: MatchMessageType.INJURY,
        en: injuryMessageEn,
        es: injuryMessageEs,
        minute: params.minute,
        turn: match.turn,
        teamId,
        teamName,
        playerName: player.playerName,
      });

      const substitutionIncident = await this.replaceInjuredPlayerIfPossible(match, {
        teamId,
        teamName,
        isUserTeam,
        minute: params.minute,
        turn: match.turn,
        eventType: params.eventType,
        injuredPlayer: player,
      });
      if (substitutionIncident) {
        incidents.push(substitutionIncident);
      }

      onField = onField.map((item) => (item.playerId === player.playerId ? player : item));
    }

    return incidents;
  }

  /**
   * Immediately replaces an injured on-field player when substitutions and bench allow it.
   */
  private async replaceInjuredPlayerIfPossible(
    match: MatchEntity,
    params: {
      teamId: string;
      teamName: string;
      isUserTeam: boolean;
      minute: number;
      turn: number;
      eventType: MatchEventType;
      injuredPlayer: MatchSquadEntity;
    },
  ): Promise<SquadTurnIncidentMessage | null> {
    const substitutionsUsed = params.isUserTeam ? match.teamSubstitutionsUsed : match.opponentSubstitutionsUsed;
    if (substitutionsUsed >= match.maxSubstitutions) {
      return null;
    }

    const bench = await this.matchSquadRepository.find({
      where: {
        matchId: match.matchId,
        teamId: params.teamId,
        isOnField: false,
        redCard: false,
        isInjured: false,
      },
      order: { energy: 'DESC' },
    });

    if (!bench.length) {
      return null;
    }

    const incoming =
      params.injuredPlayer.position === 'GK'
        ? bench.find((candidate) => candidate.position === 'GK')
        : bench.find((candidate) => candidate.position === params.injuredPlayer.position) ||
          bench.find((candidate) => candidate.position === 'MF') ||
          bench[0];
    if (!incoming) {
      return null;
    }

    incoming.isOnField = true;
    incoming.energy = Math.max(incoming.energy, 45);
    await this.matchSquadRepository.save(incoming);

    if (params.isUserTeam) {
      match.teamSubstitutionsUsed += 1;
    } else {
      match.opponentSubstitutionsUsed += 1;
    }

    const substitutionMessageKey = this.chance(0.5)
      ? 'match.timeline.substitution'
      : 'match.timeline.substitution.entersField';
    const substitutionParams = {
      teamName: params.teamName,
      incomingPlayerName: incoming.playerName,
      outgoingPlayerName: params.injuredPlayer.playerName,
    };
    const substitutionMessageEn = this.i18nService.t(substitutionMessageKey, 'en', substitutionParams);
    const substitutionMessageEs = this.i18nService.t(substitutionMessageKey, 'es', substitutionParams);

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: params.minute,
      turn: params.turn,
      eventType: params.eventType,
      action: null,
      teamId: params.teamId,
      teamName: params.teamName,
      playerName: incoming.playerName,
      playerPosition: incoming.position,
      cardType: null,
      isGoal: false,
      message: substitutionMessageEn,
      messageKey: substitutionMessageKey,
      messageParams: substitutionParams,
    });

    return {
      type: MatchMessageType.SUBSTITUTION,
      en: substitutionMessageEn,
      es: substitutionMessageEs,
      minute: params.minute,
      turn: params.turn,
      teamId: params.teamId,
      teamName: params.teamName,
      playerName: incoming.playerName,
    };
  }

  /**
   * Injury chance per turn combines fatigue, age and randomness.
   * Goalkeepers are handled by caller and excluded from this flow.
   */
  private resolveInjuryChance(
    energy: number,
    age: number,
    hasNoSubsRemaining: boolean,
  ): number {
    let chance = 0.004;

    if (energy <= 55) {
      chance += 0.02;
    }
    if (energy <= 40) {
      chance += 0.04;
    }
    if (energy <= 28) {
      chance += 0.06;
    }

    if (age >= 30) {
      chance += 0.01;
    }
    if (age >= 34) {
      chance += 0.015;
    }
    if (age >= 37) {
      chance += 0.02;
    }

    if (hasNoSubsRemaining && energy <= 40) {
      chance += 0.02;
    }

    return Math.max(0.003, Math.min(0.2, chance));
  }

  /**
   * Counts active on-field players for one team.
   */
  private async countOnFieldPlayers(matchId: string, teamId: string): Promise<number> {
    return this.matchSquadRepository.count({
      where: { matchId, teamId, isOnField: true, redCard: false, isInjured: false },
    });
  }

  /**
   * Stores one stat line in match_stats.
   */
  private async recordMatchStat(params: MatchStatRecordParams): Promise<void> {
    const stat = this.matchStatRepository.create({
      matchId: params.matchId,
      minute: params.minute,
      turn: params.turn,
      eventType: params.eventType,
      action: params.action,
      teamId: params.teamId,
      teamName: params.teamName,
      playerId: null,
      playerName: params.playerName,
      playerPosition: params.playerPosition,
      cardType: params.cardType,
      isGoal: params.isGoal,
      messageKey: params.messageKey || null,
      messageParamsJson: params.messageParams ? JSON.stringify(params.messageParams) : null,
      message: params.message,
    });

    await this.matchStatRepository.save(stat);
  }

  /**
   * Ensures each team has one active captain on the field.
   * If current captain leaves, best available on-field player gets the armband.
   */
  private async ensureTeamCaptainOnField(
    match: MatchEntity,
    params: {
      teamId: string;
      teamName: string;
      minute: number;
      turn: number;
      eventType: MatchEventType;
    },
  ): Promise<SquadTurnIncidentMessage | null> {
    const onField = await this.matchSquadRepository.find({
      where: {
        matchId: match.matchId,
        teamId: params.teamId,
        isOnField: true,
        redCard: false,
        isInjured: false,
      },
    });

    if (!onField.length) {
      return null;
    }

    if (onField.some((player) => player.isCaptain)) {
      return null;
    }

    const newCaptain = [...onField].sort((a, b) => {
      const scoreA = this.roleScoreFromSnapshot(a, MatchStrategy.BALANCED);
      const scoreB = this.roleScoreFromSnapshot(b, MatchStrategy.BALANCED);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      const leadershipA = this.resolveCaptainLeadershipBonus(a.age);
      const leadershipB = this.resolveCaptainLeadershipBonus(b.age);
      if (leadershipB !== leadershipA) {
        return leadershipB - leadershipA;
      }

      return b.skill - a.skill;
    })[0];

    if (!newCaptain) {
      return null;
    }

    const allTeamRows = await this.matchSquadRepository.find({
      where: { matchId: match.matchId, teamId: params.teamId },
    });
    allTeamRows.forEach((row) => {
      row.isCaptain = row.squadId === newCaptain.squadId;
    });
    await this.matchSquadRepository.save(allTeamRows);

    const messageEn = this.i18nService.t('match.timeline.captainChange', 'en', {
      teamName: params.teamName,
      playerName: newCaptain.playerName,
    });
    const messageEs = this.i18nService.t('match.timeline.captainChange', 'es', {
      teamName: params.teamName,
      playerName: newCaptain.playerName,
    });

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: params.minute,
      turn: params.turn,
      eventType: params.eventType,
      action: null,
      teamId: params.teamId,
      teamName: params.teamName,
      playerName: newCaptain.playerName,
      playerPosition: newCaptain.position,
      cardType: null,
      isGoal: false,
      message: messageEn,
      messageKey: 'match.timeline.captainChange',
      messageParams: {
        teamName: params.teamName,
        playerName: newCaptain.playerName,
      },
    });

    return {
      type: MatchMessageType.INFO,
      en: messageEn,
      es: messageEs,
      minute: params.minute,
      turn: params.turn,
      teamId: params.teamId,
      teamName: params.teamName,
      playerName: newCaptain.playerName,
    };
  }

  /**
   * Converts a formation into desired outfield distribution (DF/MF/FW).
   */
  private resolveOutfieldTargets(formation: MatchFormation | null): { df: number; mf: number; fw: number } {
    if (!formation) {
      return { df: 4, mf: 4, fw: 2 };
    }

    const segments = String(formation)
      .split('-')
      .map((segment) => Number(segment.trim()))
      .filter((value) => Number.isInteger(value) && value >= 0);

    if (segments.length < 3) {
      return { df: 4, mf: 4, fw: 2 };
    }

    const df = segments[0];
    const fw = segments[segments.length - 1];
    const mf = segments.slice(1, segments.length - 1).reduce((acc, current) => acc + current, 0);
    const total = df + mf + fw;

    if (total !== 10) {
      return { df: 4, mf: 4, fw: 2 };
    }

    return { df, mf, fw };
  }

  /**
   * Scores one team player for lineup/tactical fit by strategy and role.
   */
  private roleScore(
    player: TeamPlayer,
    strategy: MatchStrategy | null,
    preferredRole?: string,
  ): number {
    const snapshot: Pick<MatchSquadEntity, 'skill' | 'attack' | 'defense' | 'position'> = {
      skill: player.skill,
      attack: player.attack,
      defense: player.defense,
      position: player.position,
    } as Pick<MatchSquadEntity, 'skill' | 'attack' | 'defense' | 'position'>;
    return this.roleScoreFromSnapshot(snapshot, strategy, preferredRole);
  }

  /**
   * Scores one squad snapshot for fit calculations.
   */
  private roleScoreFromSnapshot(
    player: Pick<MatchSquadEntity, 'skill' | 'attack' | 'defense' | 'position'>,
    strategy: MatchStrategy | null,
    preferredRole?: string,
  ): number {
    const roleMatchBonus = preferredRole && player.position === preferredRole ? 12 : 0;
    const roleMismatchPenalty = preferredRole && player.position !== preferredRole ? -6 : 0;

    switch (strategy) {
      case MatchStrategy.ATTACK:
        return player.attack * 2 + player.skill + player.defense * 0.6 + roleMatchBonus + roleMismatchPenalty;
      case MatchStrategy.DEFENSE:
        return player.defense * 2 + player.skill + player.attack * 0.6 + roleMatchBonus + roleMismatchPenalty;
      case MatchStrategy.COUNTER_ATTACK:
        return (
          player.attack * 1.5 +
          player.skill * 1.25 +
          player.defense * 0.8 +
          roleMatchBonus +
          roleMismatchPenalty
        );
      case MatchStrategy.POSSESSION:
        return (
          player.skill * 2 +
          player.attack * 1.05 +
          player.defense * 0.95 +
          roleMatchBonus +
          roleMismatchPenalty
        );
      case MatchStrategy.PENALTIES:
        return (
          player.skill * 1.4 +
          player.attack * 1.2 +
          player.defense * 1.2 +
          roleMatchBonus +
          roleMismatchPenalty
        );
      case MatchStrategy.BALANCED:
      default:
        return player.skill + player.attack + player.defense + roleMatchBonus + roleMismatchPenalty;
    }
  }

  /**
   * Leadership bonus used as captain tie-breaker by age.
   * Prime leadership window is 27..34 years old.
   */
  private resolveCaptainLeadershipBonus(age: number): number {
    if (age >= 27 && age <= 34) {
      return 3;
    }
    if ((age >= 24 && age <= 26) || (age >= 35 && age <= 37)) {
      return 2;
    }
    if (age >= 21 && age <= 23) {
      return 1;
    }

    return 0;
  }
}
