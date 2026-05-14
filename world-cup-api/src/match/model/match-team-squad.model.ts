import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchStrategy } from './match-strategy.enum';
import { MatchSquadPlayer } from './match-squad-player.model';
import { MatchTeamTacticalBreakdown } from './match-team-tactical-breakdown.model';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';

export class MatchTeamSquad {
  @ApiProperty({ example: 'arg' })
  id: string;

  @ApiProperty({ example: 'Argentina' })
  name: string;

  @ApiProperty({ enum: MatchFormation, nullable: true, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation | null;

  @ApiProperty({ enum: MatchStrategy, nullable: true, example: MatchStrategy.COUNTER_ATTACK })
  strategy: MatchStrategy | null;

  @ApiProperty({ example: 'Lionel Scaloni', nullable: true })
  coachName: string | null;

  @ApiProperty({ enum: CoachProfile, nullable: true, example: CoachProfile.REACTIVE })
  coachProfile: CoachProfile | null;

  @ApiProperty({ type: MatchTeamTacticalBreakdown })
  tacticalBreakdown: MatchTeamTacticalBreakdown;

  @ApiProperty({ example: 5 })
  maxSubstitutions: number;

  @ApiProperty({ example: 2 })
  substitutionsUsed: number;

  @ApiProperty({ example: 3 })
  remainingSubstitutions: number;

  @ApiProperty({ example: 10 })
  onFieldCount: number;

  @ApiProperty({ type: [MatchSquadPlayer] })
  starters: MatchSquadPlayer[];

  @ApiProperty({ type: [MatchSquadPlayer] })
  onField: MatchSquadPlayer[];

  @ApiProperty({ type: [MatchSquadPlayer] })
  bench: MatchSquadPlayer[];
}
