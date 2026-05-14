import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStrategy } from './match-strategy.enum';

export class FormationCatalogItem {
  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_3_3 })
  formation: MatchFormation;

  @ApiProperty({ example: 'Attacking setup with wide forwards and midfield balance.' })
  description: string;

  @ApiProperty({ type: [String], enum: MatchStrategy, example: [MatchStrategy.ATTACK, MatchStrategy.POSSESSION] })
  compatibleStrategies: MatchStrategy[];
}
