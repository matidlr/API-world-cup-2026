import { ApiProperty } from '@nestjs/swagger';
import { MatchTeamLineup } from './match-team-lineup.model';

export class MatchLineupsResponse {
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

  @ApiProperty({ type: MatchTeamLineup })
  team: MatchTeamLineup;

  @ApiProperty({ type: MatchTeamLineup })
  opponent: MatchTeamLineup;
}
