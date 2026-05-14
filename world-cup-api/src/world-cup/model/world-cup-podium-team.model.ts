import { ApiProperty } from '@nestjs/swagger';

export class WorldCupPodiumTeam {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ example: 'Argentina' })
  teamName: string;
}
