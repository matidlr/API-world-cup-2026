import { ApiProperty } from '@nestjs/swagger';
import { MatchCardType } from 'src/match/model/match-card-type.enum';

export class WorldCupMatchCardDetail {
  @ApiProperty({ example: 'Cristian Romero' })
  playerName: string;

  @ApiProperty({ example: 34 })
  minute: number;

  @ApiProperty({ enum: MatchCardType, example: MatchCardType.YELLOW })
  cardType: MatchCardType;
}

