import { ApiProperty } from '@nestjs/swagger';

export class WorldCupMatchPlayerMinuteDetail {
  @ApiProperty({ example: 'Lionel Messi' })
  playerName: string;

  @ApiProperty({ example: 67 })
  minute: number;
}

