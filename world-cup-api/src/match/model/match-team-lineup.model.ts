import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';
import { MatchSquadPlayer } from './match-squad-player.model';

export class MatchTeamLineup {
  @ApiProperty({ example: 'arg' })
  id: string;

  @ApiProperty({ example: 'Argentina' })
  name: string;

  @ApiProperty({ enum: MatchFormation, nullable: true, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation | null;

  @ApiProperty({ example: 11 })
  onFieldCount: number;

  @ApiProperty({ type: [MatchSquadPlayer] })
  onField: MatchSquadPlayer[];
}
