import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStrategy } from './match-strategy.enum';
import { MatchTacticalLine } from './match-tactical-line.model';

export class StrategyCatalogItem {
  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy;

  @ApiProperty({ example: 'Fast transitions after defensive recovery.' })
  description: string;

  @ApiProperty({ type: [String], enum: MatchFormation, example: [MatchFormation.F_4_4_2, MatchFormation.F_3_5_2] })
  compatibleFormations: MatchFormation[];

  @ApiProperty({
    type: MatchTacticalLine,
    description: 'Strategy tactical impact over team lines.',
  })
  strategyLineImpact: MatchTacticalLine;
}
