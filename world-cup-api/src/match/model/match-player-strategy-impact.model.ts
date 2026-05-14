import { ApiProperty } from '@nestjs/swagger';

export class MatchPlayerStrategyImpact {
  @ApiProperty({ example: 4 })
  attackDelta: number;

  @ApiProperty({ example: -2 })
  defenseDelta: number;

  @ApiProperty({ example: 1 })
  skillDelta: number;
}
