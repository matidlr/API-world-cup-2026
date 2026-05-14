import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object';
import { CoachProfileDictionary } from './model/coach-profile-dictionary.model';
import { GameDictionary } from './model/game-dictionary.model';
import { ReferenceService } from './reference.service';

@ApiTags('reference')
@Controller('reference')
/**
 * HTTP layer for educational reference endpoints used by students.
 */
export class ReferenceController extends AbstractController {
  constructor(private readonly referenceService: ReferenceService) {
    super();
  }

  @Get('game-dictionary')
  @ApiOperation({
    summary: 'Get football/game dictionary for students',
    description:
      'Returns football terms and gameplay catalogs (positions, actions, events, stats, message types, strategies, formations) in en/es. Default language is en.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language. Supports en, es. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: GameDictionary })
  /**
   * Returns localized dictionary to simplify frontend integration for non-football users.
   */
  async getGameDictionary(@Query('lang') lang?: string): Promise<ResponseObject<GameDictionary>> {
    const result = this.referenceService.getGameDictionary(lang);
    return this.createOkResponse(result);
  }

  @Get('coach-profiles')
  @ApiOperation({
    summary: 'Get coach profile catalog',
    description:
      'Returns coach profile definitions with label/description/example in en/es. Default language is en.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language. Supports en, es. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: CoachProfileDictionary })
  /**
   * Returns localized coach profile glossary for frontend students.
   */
  async getCoachProfiles(@Query('lang') lang?: string): Promise<ResponseObject<CoachProfileDictionary>> {
    const normalizedLang = !lang || lang.trim().toLowerCase() !== 'es' ? 'en' : 'es';
    const coachProfiles = this.referenceService.getCoachProfiles(lang);
    return this.createOkResponse({ lang: normalizedLang, coachProfiles });
  }
}
