import { ApiProperty } from '@nestjs/swagger';
import { WorldCupGroupTeam } from './world-cup-group-team.model';

export class WorldCupGroup {
  @ApiProperty({ example: 'A' })
  group: string;

  @ApiProperty({ type: [WorldCupGroupTeam] })
  teams: WorldCupGroupTeam[];
}
