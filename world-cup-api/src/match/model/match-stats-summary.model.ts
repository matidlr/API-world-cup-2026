import { ApiProperty } from '@nestjs/swagger';

export class MatchStatsSummary {
  @ApiProperty({ example: 2 })
  teamGoals: number;

  @ApiProperty({ example: 1 })
  opponentGoals: number;

  @ApiProperty({ example: 1 })
  teamYellowCards: number;

  @ApiProperty({ example: 0 })
  teamRedCards: number;

  @ApiProperty({ example: 2 })
  opponentYellowCards: number;

  @ApiProperty({ example: 1 })
  opponentRedCards: number;
}
