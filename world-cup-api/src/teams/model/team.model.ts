import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';
import { TeamEntity } from '../entity/team.entity';

export class Team {
  @ApiProperty({ example: 'arg' })
  id: string;

  @ApiProperty({ example: 'Argentina' })
  name: string;

  @ApiProperty({ example: 'CONMEBOL' })
  group: string;

  @ApiProperty({ example: 'CONMEBOL' })
  footballAssociation: string;

  @ApiProperty({ example: 92 })
  rating: number;

  @ApiProperty({ example: 'Lionel Scaloni' })
  coach: string;

  @ApiProperty({ example: 'Lionel Messi' })
  captain: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation;

  @ApiProperty()
  creationDate: Date;

  @ApiProperty()
  lastUpdate: Date;

  static fromEntityToModel(entity: TeamEntity): Team {
    return {
      id: entity.teamId,
      name: entity.name,
      group: entity.groupName,
      footballAssociation: entity.footballAssociation,
      rating: entity.rating,
      coach: entity.coach,
      captain: entity.captain,
      strategy: entity.strategy,
      formation: entity.formation,
      creationDate: entity.creationDate,
      lastUpdate: entity.lastUpdate,
    };
  }
}
