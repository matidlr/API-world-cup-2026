import { ApiProperty } from '@nestjs/swagger';
import { MatchEventType } from './match-event-type.enum';
import { MatchFieldZone } from './match-field-zone.enum';
import { MatchFormation } from './match-formation.enum';
import { MatchMessageItem } from './match-message-item.model';
import { MatchOption } from './match-option.model';
import { MatchPossession } from './match-possession.enum';
import { MatchResult } from './match-result.enum';
import { MatchStrategy } from './match-strategy.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { MatchCurrentContext } from '../interfaces/match-current-context.interface';

export class MatchResponse {
  @ApiProperty({ example: 'final-001' })
  matchId: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'fra' })
  opponentId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'France' })
  opponentName: string;

  @ApiProperty({ type: [MatchMessageItem] })
  messageItems: MatchMessageItem[];

  @ApiProperty({ example: '1-0' })
  score: string;

  @ApiProperty({ example: 35 })
  minute: number;

  @ApiProperty({ example: 3 })
  turn: number;

  @ApiProperty({ enum: MatchFieldZone, example: MatchFieldZone.MIDFIELD })
  zone: MatchFieldZone;

  @ApiProperty({ enum: MatchPossession, example: MatchPossession.USER })
  possession: MatchPossession;

  @ApiProperty({ example: 'Lionel Messi' })
  ballCarrier: string;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.COUNTER_ATTACK, nullable: true })
  teamStrategy: MatchStrategy | null;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2, nullable: true })
  teamFormation: MatchFormation | null;

  @ApiProperty({ example: 'Lionel Scaloni', nullable: true })
  teamCoachName: string | null;

  @ApiProperty({ enum: CoachProfile, example: CoachProfile.REACTIVE, nullable: true })
  teamCoachProfile: CoachProfile | null;

  @ApiProperty({ enum: MatchStrategy, example: MatchStrategy.ATTACK, nullable: true })
  opponentStrategy: MatchStrategy | null;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_3_3, nullable: true })
  opponentFormation: MatchFormation | null;

  @ApiProperty({ example: 'Pape Thiaw', nullable: true })
  opponentCoachName: string | null;

  @ApiProperty({ enum: CoachProfile, example: CoachProfile.BALANCED, nullable: true })
  opponentCoachProfile: CoachProfile | null;

  @ApiProperty({ enum: MatchEventType, example: MatchEventType.KICKOFF_EVENT })
  eventType: MatchEventType;

  @ApiProperty({ type: [MatchOption] })
  options: MatchOption[];

  @ApiProperty({ example: false })
  isFinished: boolean;

  @ApiProperty({ enum: MatchResult, required: false, nullable: true })
  result: MatchResult | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: 'object',
    description: 'Turn context snapshot used by the match engine for the latest resolved action.',
  })
  currentContext?: MatchCurrentContext | null;
}
