import { ApiProperty } from '@nestjs/swagger';
import { MatchAction } from './match-action.enum';

export class MatchOption {
  @ApiProperty({ example: 1 })
  index: number;

  @ApiProperty({ example: 'Atacar' })
  label: string;

  @ApiProperty({ enum: MatchAction, example: MatchAction.ATTACK })
  action: MatchAction;
}
