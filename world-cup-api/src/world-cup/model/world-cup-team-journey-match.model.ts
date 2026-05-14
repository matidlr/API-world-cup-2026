import { ApiProperty } from '@nestjs/swagger';
import { WorldCupMatchResolution } from './world-cup-match-resolution.enum';
import { WorldCupStage } from './world-cup-stage.enum';
import { WorldCupTeamJourneyMatchResult } from './world-cup-team-journey-match-result.enum';

export class WorldCupTeamJourneyMatch {
  @ApiProperty({ enum: WorldCupStage, example: WorldCupStage.QUARTER_FINALS })
  stage: WorldCupStage;

  @ApiProperty({ example: 'QF-2' })
  matchCode: string;

  @ApiProperty({ example: 'bra' })
  opponentTeamId: string;

  @ApiProperty({ example: 'Brazil' })
  opponentTeamName: string;

  @ApiProperty({ example: 2, nullable: true })
  goalsFor: number | null;

  @ApiProperty({ example: 1, nullable: true })
  goalsAgainst: number | null;

  @ApiProperty({ enum: WorldCupTeamJourneyMatchResult, example: WorldCupTeamJourneyMatchResult.WIN })
  result: WorldCupTeamJourneyMatchResult;

  @ApiProperty({ enum: WorldCupMatchResolution, example: WorldCupMatchResolution.REGULAR_TIME })
  resolution: WorldCupMatchResolution;

  @ApiProperty({ example: false })
  isPending: boolean;
}
