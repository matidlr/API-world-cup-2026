import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object';
import { MatchResponse } from './model/match-response.model';
import { FormationCatalogItem } from './model/formation-catalog-item.model';
import { MatchLineupsResponse } from './model/match-lineups-response.model';
import { MatchMessageType } from './model/match-message-type.enum';
import { MatchSquadResponse } from './model/match-squad-response.model';
import { MatchStatsResponse } from './model/match-stats-response.model';
import { ResetTeamTacticsResponse } from './model/reset-team-tactics.response';
import { SelectFormationResponse } from './model/select-formation.response';
import { SelectStrategyResponse } from './model/select-strategy.response';
import { StrategyCatalogItem } from './model/strategy-catalog-item.model';
import { MatchService } from './match.service';
import { PlayRequest } from './request/play.request';
import { SelectFormationRequest } from './request/select-formation.request';
import { ResetTeamTacticsRequest } from './request/reset-team-tactics.request';
import { SelectStrategyRequest } from './request/select-strategy.request';
import { StartFinalRequest } from './request/start-final.request';

@ApiTags('match')
@Controller('match')
/**
 * HTTP layer for final match lifecycle and match telemetry endpoints.
 */
export class MatchController extends AbstractController {
  constructor(private readonly matchService: MatchService) {
    super();
  }

  @Get('current/stats')
  @ApiOperation({
    summary: 'Get stats for the current active match',
    description:
      'Returns aggregated score cards and event timeline for the active final. If no active final exists, returns the latest final from current world cup.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language for timeline messages. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: MatchStatsResponse })
  /**
   * Returns telemetry for the active final match.
   */
  async getCurrentMatchStats(@Query('lang') lang?: string): Promise<ResponseObject<MatchStatsResponse>> {
    const result = await this.matchService.getCurrentMatchStats(lang);
    return this.createOkResponse(result);
  }

  @Get('current/squad')
  @ApiOperation({
    summary: 'Get squad state for the current active match',
    description:
      'Returns formations, strategies, tactical breakdown, starters, on-field players, bench, substitutions and player live/effective stats. If no active final exists, returns the latest final from current world cup.',
  })
  @ApiOkResponse({ type: MatchSquadResponse })
  /**
   * Returns squad-level telemetry for the active final match.
   */
  async getCurrentMatchSquad(): Promise<ResponseObject<MatchSquadResponse>> {
    const result = await this.matchService.getCurrentMatchSquad();
    return this.createOkResponse(result);
  }

  @Get('current/lineups')
  @ApiOperation({
    summary: 'Get current on-field lineups for the active match',
    description:
      'Returns only the players currently on field for both teams in the active final match. If no active final exists, returns the latest final from current world cup.',
  })
  @ApiOkResponse({ type: MatchLineupsResponse })
  /**
   * Returns the current on-field lineups for the active final match.
   */
  async getCurrentMatchLineups(): Promise<ResponseObject<MatchLineupsResponse>> {
    const result = await this.matchService.getCurrentMatchLineups();
    return this.createOkResponse(result);
  }

  @Get(':matchId/stats')
  @ApiOperation({
    summary: 'Get stats for a match by id',
    description: 'Returns aggregated score cards and event timeline for the provided match id.',
  })
  @ApiParam({ name: 'matchId', example: 'final_xxx' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language for timeline messages. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: MatchStatsResponse })
  /**
   * Returns telemetry for a specific match id.
   */
  async getMatchStatsById(
    @Param('matchId') matchId: string,
    @Query('lang') lang?: string,
  ): Promise<ResponseObject<MatchStatsResponse>> {
    const result = await this.matchService.getMatchStatsById(matchId, lang);
    return this.createOkResponse(result);
  }

  @Get(':matchId/squad')
  @ApiOperation({
    summary: 'Get squad state for a match by id',
    description:
      'Returns formations, strategies, tactical breakdown, starters, on-field players, bench, substitutions and player live/effective stats.',
  })
  @ApiParam({ name: 'matchId', example: 'final_xxx' })
  @ApiOkResponse({ type: MatchSquadResponse })
  /**
   * Returns squad-level telemetry for a specific match id.
   */
  async getMatchSquadById(
    @Param('matchId') matchId: string,
  ): Promise<ResponseObject<MatchSquadResponse>> {
    const result = await this.matchService.getMatchSquadById(matchId);
    return this.createOkResponse(result);
  }

  @Get(':matchId/lineups')
  @ApiOperation({
    summary: 'Get on-field lineups for a match by id',
    description: 'Returns only the players currently on field for both teams in the selected match.',
  })
  @ApiParam({ name: 'matchId', example: 'final_xxx' })
  @ApiOkResponse({ type: MatchLineupsResponse })
  /**
   * Returns on-field lineups for a specific match id.
   */
  async getMatchLineupsById(
    @Param('matchId') matchId: string,
  ): Promise<ResponseObject<MatchLineupsResponse>> {
    const result = await this.matchService.getMatchLineupsById(matchId);
    return this.createOkResponse(result);
  }

  @Get('strategies')
  @ApiOperation({
    summary: 'List available match strategies',
    description:
      'Returns all strategy options and compatible formations for each one. Supports localized descriptions via `lang`.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language for descriptions. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: [StrategyCatalogItem] })
  /**
   * Returns strategy catalog used by UI/backends.
   */
  async listStrategies(@Query('lang') lang?: string): Promise<ResponseObject<StrategyCatalogItem[]>> {
    const result = this.matchService.listStrategies(lang);
    return this.createOkResponse(result);
  }

  @Get('formations')
  @ApiOperation({
    summary: 'List available formations',
    description:
      'Returns all formation options and compatible strategies for each one. Supports localized descriptions via `lang`.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Optional language for descriptions. Default: en.',
    example: 'en',
  })
  @ApiOkResponse({ type: [FormationCatalogItem] })
  /**
   * Returns formation catalog used by UI/backends.
   */
  async listFormations(@Query('lang') lang?: string): Promise<ResponseObject<FormationCatalogItem[]>> {
    const result = this.matchService.listFormations(lang);
    return this.createOkResponse(result);
  }

  @Get('message-types')
  @ApiOperation({
    summary: 'List message item types',
    description:
      'Returns all available message types so frontends can map visuals without reading backend source code.',
  })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(MatchMessageType),
      },
      example: Object.values(MatchMessageType),
    },
  })
  /**
   * Returns catalog of typed message categories used in `messageItems`.
   */
  async listMessageTypes(): Promise<ResponseObject<MatchMessageType[]>> {
    const result = this.matchService.listMessageTypes();
    return this.createOkResponse(result);
  }

  @Get('historic-finals')
  @ApiOperation({
    summary: 'List historic final ids',
    description:
      'Returns only historical (finished) final match ids. The current active final is never included.',
  })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['final_95c2d4ad-7f63-44d7-b59f-8bc4e3f5b870', 'final_88c3f1ea-2f33-4be1-9639-bccd1479dd2a'],
    },
  })
  /**
   * Returns finished final ids for history browsing, excluding active match.
   */
  async listHistoricFinalIds(): Promise<ResponseObject<string[]>> {
    const result = await this.matchService.listHistoricFinalIds();
    return this.createOkResponse(result);
  }

  @Post('start-final')
  @ApiOperation({
    summary: 'Start a final or return the active final',
    description:
      'Creates a new final match if none is active, otherwise returns the current active one. Optional teamId must be one of the two finalists from current world cup.',
  })
  @ApiBody({ type: StartFinalRequest })
  @ApiOkResponse({ type: MatchResponse })
  /**
   * Starts the final flow.
   */
  async startFinal(@Body() request: StartFinalRequest): Promise<ResponseObject<MatchResponse>> {
    const result = await this.matchService.startFinal(request);
    return this.createOkResponse(result);
  }

  @Post('select-strategy')
  @ApiOperation({
    summary: 'Select strategy for a team',
    description:
      'Updates the strategy associated with a team and uses it in future turns. If AUTO_ADJUST_FORMATION_ON_STRATEGY_CHANGE is enabled and the current formation is incompatible, formation is auto-adjusted.',
  })
  @ApiBody({ type: SelectStrategyRequest })
  @ApiOkResponse({ type: SelectStrategyResponse })
  /**
   * Updates team strategy configuration.
   */
  async selectStrategy(
    @Body() request: SelectStrategyRequest,
  ): Promise<ResponseObject<SelectStrategyResponse>> {
    const result = await this.matchService.selectStrategy(request);
    return this.createOkResponse(result);
  }

  @Post('select-formation')
  @ApiOperation({
    summary: 'Select formation for a team',
    description:
      'Updates the formation associated with a team and uses it in future turns and finals.',
  })
  @ApiBody({ type: SelectFormationRequest })
  @ApiOkResponse({ type: SelectFormationResponse })
  /**
   * Updates team formation configuration.
   */
  async selectFormation(
    @Body() request: SelectFormationRequest,
  ): Promise<ResponseObject<SelectFormationResponse>> {
    const result = await this.matchService.selectFormation(request);
    return this.createOkResponse(result);
  }

  @Post('reset-team-tactics')
  @ApiOperation({
    summary: 'Reset team tactics to default selection values',
    description:
      'Restores one team strategy and formation to its default values defined by the initial team setup.',
  })
  @ApiBody({ type: ResetTeamTacticsRequest })
  @ApiOkResponse({ type: ResetTeamTacticsResponse })
  /**
   * Restores one team tactics to its default setup.
   */
  async resetTeamTactics(
    @Body() request: ResetTeamTacticsRequest,
  ): Promise<ResponseObject<ResetTeamTacticsResponse>> {
    const result = await this.matchService.resetTeamTacticsToDefault(request);
    return this.createOkResponse(result);
  }

  @Post('play')
  @ApiOperation({
    summary: 'Play one step using selected option',
    description:
      'Resolves one match step, updates state, computes incidents/goals, and returns next options plus typed timeline messages (`messageItems`). During half-time, options are `RESTART_MATCH` or `QUIT_MATCH`.',
  })
  @ApiBody({ type: PlayRequest })
  @ApiOkResponse({ type: MatchResponse })
  /**
   * Resolves one turn for an active match.
   */
  async play(@Body() request: PlayRequest): Promise<ResponseObject<MatchResponse>> {
    const result = await this.matchService.play(request);
    return this.createOkResponse(result);
  }
}
