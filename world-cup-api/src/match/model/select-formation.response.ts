import { ApiProperty } from '@nestjs/swagger';
import { MatchFormation } from './match-formation.enum';

export class SelectFormationResponse {
  @ApiProperty({ example: 'arg' })
  teamId: string;

  @ApiProperty({ enum: MatchFormation, example: MatchFormation.F_4_4_2 })
  formation: MatchFormation;

  @ApiProperty({ example: 'Team formation updated successfully' })
  message: string;
}
