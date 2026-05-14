import { ApiProperty } from '@nestjs/swagger';

export class WorldCupMatchPlayerOfMatch {
  @ApiProperty({ example: 'Lionel Messi' })
  playerName: string;

  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;
}
