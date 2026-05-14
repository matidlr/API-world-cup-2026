import { ApiProperty } from '@nestjs/swagger';
import { WorldCupMatchResolution } from './world-cup-match-resolution.enum';
import { WorldCupStage } from './world-cup-stage.enum';
import { WorldCupMatchCardDetail } from './world-cup-match-card-detail.model';
import { WorldCupMatchPlayerMinuteDetail } from './world-cup-match-player-minute-detail.model';
import { WorldCupMatchPlayerOfMatch } from './world-cup-match-player-of-match.model';
import { WorldCupMatchSubstitutionDetail } from './world-cup-match-substitution-detail.model';

export class WorldCupMatch {
  @ApiProperty({ example: 'GROUP_STAGE', enum: WorldCupStage })
  stage: WorldCupStage;

  @ApiProperty({ example: 'A', nullable: true })
  groupName: string | null;

  @ApiProperty({ example: 'A-M1' })
  matchCode: string;

  @ApiProperty({ example: 'arg' })
  homeTeamId: string;

  @ApiProperty({ example: 'Argentina' })
  homeTeamName: string;

  @ApiProperty({ example: 'fra' })
  awayTeamId: string;

  @ApiProperty({ example: 'France' })
  awayTeamName: string;

  @ApiProperty({ example: 2, nullable: true })
  homeGoals: number | null;

  @ApiProperty({ example: 1, nullable: true })
  awayGoals: number | null;

  @ApiProperty({ example: 5, nullable: true })
  homePenaltyGoals: number | null;

  @ApiProperty({ example: 4, nullable: true })
  awayPenaltyGoals: number | null;

  @ApiProperty({ example: 'arg', nullable: true })
  winnerTeamId: string | null;

  @ApiProperty({ example: 'Argentina', nullable: true })
  winnerTeamName: string | null;

  @ApiProperty({ enum: WorldCupMatchResolution, example: WorldCupMatchResolution.REGULAR_TIME })
  resolution: WorldCupMatchResolution;

  @ApiProperty({ example: false })
  isPending: boolean;

  @ApiProperty({ type: WorldCupMatchPlayerOfMatch, nullable: true })
  playerOfMatch: WorldCupMatchPlayerOfMatch | null;

  @ApiProperty({ example: 2 })
  homeTeamTotalYellowCards: number;

  @ApiProperty({ example: 0 })
  homeTeamTotalRedCards: number;

  @ApiProperty({ example: 1 })
  awayTeamTotalYellowCards: number;

  @ApiProperty({ example: 1 })
  awayTeamTotalRedCards: number;

  @ApiProperty({ type: [WorldCupMatchPlayerMinuteDetail] })
  homeTeamGoalsDetails: WorldCupMatchPlayerMinuteDetail[];

  @ApiProperty({ type: [WorldCupMatchPlayerMinuteDetail] })
  awayTeamGoalsDetails: WorldCupMatchPlayerMinuteDetail[];

  @ApiProperty({ type: [WorldCupMatchCardDetail] })
  homeTeamCardsDetails: WorldCupMatchCardDetail[];

  @ApiProperty({ type: [WorldCupMatchCardDetail] })
  awayTeamCardsDetails: WorldCupMatchCardDetail[];

  @ApiProperty({ type: [WorldCupMatchPlayerMinuteDetail] })
  homeTeamInjuriesDetails: WorldCupMatchPlayerMinuteDetail[];

  @ApiProperty({ type: [WorldCupMatchPlayerMinuteDetail] })
  awayTeamInjuriesDetails: WorldCupMatchPlayerMinuteDetail[];

  @ApiProperty({ type: [WorldCupMatchSubstitutionDetail] })
  homeTeamSubstitutionsDetails: WorldCupMatchSubstitutionDetail[];

  @ApiProperty({ type: [WorldCupMatchSubstitutionDetail] })
  awayTeamSubstitutionsDetails: WorldCupMatchSubstitutionDetail[];
}
