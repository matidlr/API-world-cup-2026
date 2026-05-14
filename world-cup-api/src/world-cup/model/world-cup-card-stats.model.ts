import { ApiProperty } from '@nestjs/swagger';

export class WorldCupCardStats {
  @ApiProperty({ example: 12 })
  totalYellowCards: number;

  @ApiProperty({ example: 1 })
  totalRedCards: number;
}
