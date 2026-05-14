import { ApiProperty } from '@nestjs/swagger';
import { MatchTeamSquad } from './match-team-squad.model';

export class MatchSquadResponse {
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

  @ApiProperty({ type: MatchTeamSquad })
  team: MatchTeamSquad;

  @ApiProperty({ type: MatchTeamSquad })
  opponent: MatchTeamSquad;
}
