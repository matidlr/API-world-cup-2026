import { ApiProperty } from '@nestjs/swagger';
import { MatchLanguage } from 'src/match/model/match-language.model';
import { GameDictionaryItem } from './game-dictionary-item.model';

export class GameDictionary {
  @ApiProperty({ enum: ['en', 'es'], example: 'en' })
  lang: MatchLanguage;

  @ApiProperty({ type: [GameDictionaryItem] })
  positions: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  zones: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  actions: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  events: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  messageTypes: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  stats: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  strategies: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  formations: GameDictionaryItem[];

  @ApiProperty({ type: [GameDictionaryItem] })
  footballTerms: GameDictionaryItem[];
}
