import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStrategy } from './match-strategy.enum';

export class SelectStrategyResponse {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.ATTACK })
  strategy: MatchStrategy;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2, nullable: true })
  formation: MatchFormation | null;

  @ApiProperty({ example: true })
  formationAutoAdjusted: boolean;

  @ApiProperty({ example: 'Team strategy updated successfully' })
  message: string;
}
