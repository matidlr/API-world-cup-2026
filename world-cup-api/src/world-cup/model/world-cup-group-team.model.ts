import { ApiProperty } from '@nestjs/swagger';

export class WorldCupGroupTeam {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'CONMEBOL' })
  confederation: string;

  @ApiProperty({ example: 3 })
  played: number;

  @ApiProperty({ example: 2 })
  wins: number;

  @ApiProperty({ example: 1 })
  draws: number;

  @ApiProperty({ example: 0 })
  losses: number;

  @ApiProperty({ example: 6 })
  goalsFor: number;

  @ApiProperty({ example: 2 })
  goalsAgainst: number;

  @ApiProperty({ example: 4 })
  goalDifference: number;

  @ApiProperty({ example: 7 })
  points: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: true })
  isQualified: boolean;

  @ApiProperty({ example: false })
  isBestThird: boolean;
}
