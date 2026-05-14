import { ApiProperty } from '@nestjs/swagger';
import { MatchLanguage } from 'src/match/model/match-language.model';
import { GameDictionaryItem } from './game-dictionary-item.model';

export class CoachProfileDictionary {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  lang: MatchLanguage;

  @ApiProperty({ type: [GameDictionaryItem] })
  coachProfiles: GameDictionaryItem[];
}
