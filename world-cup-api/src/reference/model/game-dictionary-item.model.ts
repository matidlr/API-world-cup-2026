import { ApiProperty } from '@nestjs/swagger';

export class GameDictionaryItem {
  @ApiProperty({ example: 'GK' })
  code: string;

  @ApiProperty({ example: 'Goalkeeper' })
  label: string;

  @ApiProperty({ example: 'Player that can use hands inside the area and defends the goal.' })
  description: string;

  @ApiProperty({
    example: 'In PENALTY_AGAINST_EVENT, the goalkeeper can choose DIVE_LEFT, DIVE_RIGHT, STAY_CENTER, or WAIT.',
    required: false,
    nullable: true,
  })
  example?: string | null;
}
