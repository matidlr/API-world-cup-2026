import { ApiProperty } from '@nestjs/swagger';
import { WorldCupStatus } from './world-cup-status.enum';
import { WorldCupTeamJourneyMatch } from './world-cup-team-journey-match.model';
import { WorldCupTeamJourneyStage } from './world-cup-team-journey-stage.enum';

export class WorldCupTeamJourney {
  @ApiProperty({ example: 'wc_abc123' })
  worldCupId: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'en', enum: ['en', 'es'] })
  lang: 'en' | 'es';

  @ApiProperty({ enum: WorldCupStatus, example: WorldCupStatus.READY_FOR_FINAL })
  worldCupStatus: WorldCupStatus;

  @ApiProperty({ enum: WorldCupTeamJourneyStage, example: WorldCupTeamJourneyStage.FINAL })
  stageReached: WorldCupTeamJourneyStage;

  @ApiProperty({ example: false })
  isChampion: boolean;

  @ApiProperty({ example: true })
  isFinalPending: boolean;

  @ApiProperty({ example: 'fra', nullable: true })
  eliminatedByTeamId: string | null;

  @ApiProperty({ example: 'France', nullable: true })
  eliminatedByTeamName: string | null;

  @ApiProperty({
    example: 'Argentina reached the final and is waiting to play it.',
  })
  summary: string;

  @ApiProperty({ type: [WorldCupTeamJourneyMatch] })
  matches: WorldCupTeamJourneyMatch[];
}
