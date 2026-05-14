import { ApiProperty } from '@nestjs/swagger';

export class WorldCupPlayerStat {
  @ApiProperty({ example: 'Lionel Messi' })
  playerName: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;

  @ApiProperty({ example: 7 })
  value: number;
}
