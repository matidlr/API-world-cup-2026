import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStrategy } from './match-strategy.enum';

export class ResetTeamTacticsResponse {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation;

  @ApiProperty({ example: 'Team tactics reset to defaults: strategy COUNTER_ATTACK, formation 4-4-2.' })
  message: string;
}
