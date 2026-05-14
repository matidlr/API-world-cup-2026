import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchStatEntity } from '../entity/match-stat.entity';
import { MatchTurnContextEntity } from '../entity/match-turn-context.entity';
import {
  MatchPersistenceHelperContract,
  RecordMatchStatParams,
  RecordMatchTurnContextParams,
} from '../interfaces/match-persistence.interface';

@Injectable()
/**
 * Centralizes persistence writes for match timeline and turn context snapshots.
 */
export class MatchPersistenceHelper implements MatchPersistenceHelperContract {
  constructor(
    @InjectRepository(MatchStatEntity)
    private readonly matchStatRepository: Repository<MatchStatEntity>,
    @InjectRepository(MatchTurnContextEntity)
    private readonly matchTurnContextRepository: Repository<MatchTurnContextEntity>,
  ) {}

  async recordMatchTurnContext(params: RecordMatchTurnContextParams): Promise<void> {
    const snapshot = this.matchTurnContextRepository.create({
      matchId: params.matchId,
      turn: params.turn,
      minute: params.minute,
      phase: params.phase,
      eventType: params.context.eventType,
      zone: params.context.zone,
      possession: params.context.possession,
      actingTeamId: params.context.actingTeamId,
      defendingTeamId: params.context.defendingTeamId,
      selectedAction: params.selectedAction,
      actionOutcome: params.actionOutcome,
      headline: params.headline,
      contextJson: JSON.stringify(params.context),
    });

    await this.matchTurnContextRepository.save(snapshot);
  }

  async recordMatchStat(params: RecordMatchStatParams): Promise<void> {
    const stat = this.matchStatRepository.create({
      matchId: params.matchId,
      minute: params.minute,
      turn: params.turn,
      eventType: params.eventType,
      zone: params.zone || null,
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
}
