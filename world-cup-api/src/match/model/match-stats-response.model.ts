import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStatItem } from './match-stat-item.model';
import { MatchStatsSummary } from './match-stats-summary.model';
import { MatchStrategy } from './match-strategy.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';

class MatchTeamInfo {
  @ApiProperty({ example: 'arg' })
  id: string;

  @ApiProperty({ example: 'Argentina' })
  name: string;

  @ApiProperty({ enum: MatchStrategy, nullable: true, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy | null;

  @ApiProperty({ enum: MatchFormation, nullable: true, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation | null;

  @ApiProperty({ example: 'Lionel Scaloni', nullable: true })
  coachName: string | null;

  @ApiProperty({ enum: CoachProfile, nullable: true, example: CoachProfile.REACTIVE })
  coachProfile: CoachProfile | null;
}

export class MatchStatsResponse {
  @ApiProperty({ example: 'final_xxx' })
  matchId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isFinished: boolean;

  @ApiProperty({ example: 54 })
  minute: number;

  @ApiProperty({ example: 3 })
  turn: number;

  @ApiProperty({ example: '1-0' })
  score: string;

  @ApiProperty({ type: MatchTeamInfo })
  team: MatchTeamInfo;

  @ApiProperty({ type: MatchTeamInfo })
  opponent: MatchTeamInfo;

  @ApiProperty({ type: MatchStatsSummary })
  summary: MatchStatsSummary;

  @ApiProperty({ type: [MatchStatItem] })
  events: MatchStatItem[];
}
