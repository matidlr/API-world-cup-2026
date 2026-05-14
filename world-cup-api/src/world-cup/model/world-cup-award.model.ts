import { ApiProperty } from '@nestjs/swagger';

export class WorldCupAward {
  @ApiProperty({ example: 'GOLDEN_BOOT' })
  code: string;

  @ApiProperty({ example: 'Lionel Messi' })
  winnerName: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'Top scorer of the tournament' })
  reason: string;

  @ApiProperty({ example: 7 })
  goals: number;

  @ApiProperty({ example: 2 })
  playerOfMatch: number;

  @ApiProperty({ example: 4, required: false, nullable: true })
  fairPlayPoints?: number | null;

  @ApiProperty({ example: 2, required: false, nullable: true })
  yellowCards?: number | null;

  @ApiProperty({ example: 1, required: false, nullable: true })
  redCards?: number | null;
}
