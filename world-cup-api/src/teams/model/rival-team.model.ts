import { ApiProperty } from '@nestjs/swagger';

export class RivalTeam {
  @ApiProperty({ example: 'bra' })
  id: string;

  @ApiProperty({ example: 'Brazil' })
  name: string;
}
