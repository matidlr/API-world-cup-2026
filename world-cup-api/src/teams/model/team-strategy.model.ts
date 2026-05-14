import { ApiProperty } from '@nestjs/swagger';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';

export class TeamStrategy {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy;
}
