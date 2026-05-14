import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';
import { TeamStatsEntity } from '../entity/team-stats.entity';

export class TeamStats {
  @ApiProperty({ example: 90 })
  attack: number;

  @ApiProperty({ example: 85 })
  defense: number;

  @ApiProperty({ example: 88 })
  midfield: number;

  @ApiProperty({ example: 92 })
  overall: number;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK })
  current_strategy: MatchStrategy;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  current_formation: MatchFormation;

  static fromEntityToModel(
    entity: TeamStatsEntity,
    strategy: MatchStrategy,
    formation: MatchFormation,
  ): TeamStats {
    return {
      attack: entity.attack,
      defense: entity.defense,
      midfield: entity.midfield,
      overall: entity.overall,
      current_strategy: strategy,
      current_formation: formation,
    };
  }
}
