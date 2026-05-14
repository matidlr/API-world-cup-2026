import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from 'src/match/model/match-formation.enum';

export class TeamFormation {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation;
}
