import { ApiProperty } from '@nestjs/swagger';

export class MatchTacticalLine {
  @ApiProperty({ example: 78 })
  attack: number;

  @ApiProperty({ example: 74 })
  defense: number;

  @ApiProperty({ example: 80 })
  midfield: number;
}
