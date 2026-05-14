import { ApiProperty } from '@nestjs/swagger';

export class MatchPlayerEffectiveStats {
  @ApiProperty({ example: 82 })
  skill: number;

  @ApiProperty({ example: 88 })
  attack: number;

  @ApiProperty({ example: 71 })
  defense: number;
}
