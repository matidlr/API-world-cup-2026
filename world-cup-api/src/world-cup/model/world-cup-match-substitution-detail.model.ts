import { ApiProperty } from '@nestjs/swagger';

export class WorldCupMatchSubstitutionDetail {
  @ApiProperty({ example: 'Lautaro Martínez' })
  playerInName: string;

  @ApiProperty({ example: 'Julián Álvarez' })
  playerOutName: string;

  @ApiProperty({ example: 72 })
  minute: number;
}

