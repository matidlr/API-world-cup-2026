import { ApiProperty } from '@nestjs/swagger';
import { MatchTacticalLine } from './match-tactical-line.model';

export class MatchTeamTacticalBreakdown {
  @ApiProperty({ type: MatchTacticalLine })
  baseTeamLine: MatchTacticalLine;

  @ApiProperty({ type: MatchTacticalLine })
  lineBoost: MatchTacticalLine;

  @ApiProperty({ example: 10 })
  compatibilityPenaltyPoints: number;

  @ApiProperty({ type: MatchTacticalLine })
  effectiveTeamLine: MatchTacticalLine;
}
