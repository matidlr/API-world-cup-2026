import { ApiProperty } from '@nestjs/swagger';

export class WorldCupFullPlayerStat {
  @ApiProperty({ example: 'ply_arg_01' })
  playerId: string;

  @ApiProperty({ example: 'Lionel Messi' })
  playerName: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 'FW' })
  position: string;

  @ApiProperty({ example: 7 })
  goals: number;

  @ApiProperty({ example: 3 })
  assists: number;

  @ApiProperty({ example: 0 })
  cleanSheets: number;

  @ApiProperty({ example: 2 })
  yellowCards: number;

  @ApiProperty({ example: 0 })
  redCards: number;

  @ApiProperty({ example: 630 })
  minutesPlayed: number;

  @ApiProperty({ example: 2 })
  playerOfMatch: number;
}
