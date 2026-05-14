import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object';
import { WorldCupAward } from './model/world-cup-award.model';
import { WorldCupFullPlayerStat } from './model/world-cup-full-player-stat.model';
import { WorldCupGroup } from './model/world-cup-group.model';
import { WorldCupMatch } from './model/world-cup-match.model';
import { WorldCupStage } from './model/world-cup-stage.enum';
import { WorldCupStats } from './model/world-cup-stats.model';
import { WorldCupTeamJourney } from './model/world-cup-team-journey.model';
import { WorldCup } from './model/world-cup.model';
import { SimulateWorldCupRequest } from './request/simulate-world-cup.request';
import { WorldCupService } from './world-cup.service';

@ApiTags('world-cup')
@Controller('world-cup')
/**
 * HTTP layer for world cup tournament simulation and query endpoints.
 */
export class WorldCupController extends AbstractController {
  constructor(private readonly worldCupService: WorldCupService) {
    super();
  }

  @Post('simulate')
  @ApiOperation({
    summary: 'Simulate full world cup path until pending final',
    description:
      'Simulates groups and knockout rounds up to a pending final. It can re-simulate only when there is no active final.',
  })
  @ApiBody({ type: SimulateWorldCupRequest })
  @ApiOkResponse({ type: WorldCup })
  /**
   * Triggers full tournament simulation.
   */
  async simulate(@Body() request: SimulateWorldCupRequest): Promise<ResponseObject<WorldCup>> {
    const result = await this.worldCupService.simulateWorldCup(request);
    return this.createOkResponse(result);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current world cup metadata',
    description:
      'Returns current world cup object with selected team/final pairing metadata and lifecycle flags (`hasActiveFinal`, `canResimulate`, `canStartFinal`).',
  })
  @ApiOkResponse({ type: WorldCup })
  /**
   * Returns current world cup metadata.
   */
  async getCurrentWorldCup(): Promise<ResponseObject<WorldCup>> {
    const result = await this.worldCupService.getCurrentWorldCup();
    return this.createOkResponse(result);
  }

  @Get('current/groups')
  @ApiOperation({
    summary: 'Get current world cup group tables',
    description: 'Returns groups with standings for the current world cup.',
  })
  @ApiOkResponse({ type: [WorldCupGroup] })
  /**
   * Returns current world cup group standings.
   */
  async getCurrentGroups(): Promise<ResponseObject<WorldCupGroup[]>> {
    const currentWorldCupId = await this.getCurrentWorldCupId();
    const result = await this.worldCupService.getGroupsById(currentWorldCupId);
    return this.createOkResponse(result);
  }

  @Get('current/matches')
  @ApiOperation({
    summary: 'Get current world cup matches',
    description: 'Returns full match list for the current world cup. Optional filter by stage.',
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: WorldCupStage,
    example: WorldCupStage.ROUND_OF_16,
    description: 'Optional stage filter. If omitted, returns all stages.',
  })
  @ApiOkResponse({ type: [WorldCupMatch] })
  /**
   * Returns all current world cup matches.
   */
  async getCurrentMatches(
    @Query('stage') stage?: string,
  ): Promise<ResponseObject<WorldCupMatch[]>> {
    const currentWorldCupId = await this.getCurrentWorldCupId();
    const result = await this.worldCupService.getMatchesById(currentWorldCupId, stage);
    return this.createOkResponse(result);
  }

  @Get('current/stats')
  @ApiOperation({
    summary: 'Get current world cup aggregated stats',
    description:
      'Returns tournament totals and top individual metrics for the current world cup. Available only when status is ENDED.',
  })
  @ApiOkResponse({ type: WorldCupStats })
  /**
   * Returns aggregated stats for the current world cup.
   */
  async getCurrentStats(): Promise<ResponseObject<WorldCupStats>> {
    const currentWorldCupId = await this.getCurrentWorldCupId();
    const result = await this.worldCupService.getStatsById(currentWorldCupId);
    return this.createOkResponse(result);
  }

  @Get('current/player-stats')
  @ApiOperation({
    summary: 'Get current world cup full player stats',
    description:
      'Returns full per-player tournament stats. Optional teamId filter. With teamId, returns full team roster including players with zero stats.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    example: 'arg',
    description: 'Optional team filter. If omitted, returns all players.',
  })
  @ApiOkResponse({ type: [WorldCupFullPlayerStat] })
  /**
   * Returns full player stats for current world cup with optional team filter.
   */
  async getCurrentPlayerStats(
    @Query('teamId') teamId?: string,
  ): Promise<ResponseObject<WorldCupFullPlayerStat[]>> {
    const currentWorldCupId = await this.getCurrentWorldCupId();
    const result = await this.worldCupService.getPlayerStatsById(currentWorldCupId, teamId);
    return this.createOkResponse(result);
  }

  @Get('current/awards')
  @ApiOperation({
    summary: 'Get current world cup awards',
    description:
      'Returns awards for the current world cup when tournament status is ENDED. If world cup is not ended, returns conflict. Supports localized reasons via `lang`.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    example: 'en',
    description: 'Optional language for award reason labels. Defaults to en.',
  })
  @ApiOkResponse({ type: [WorldCupAward] })
  /**
   * Returns current world cup awards.
   */
  async getCurrentAwards(@Query('lang') lang?: string): Promise<ResponseObject<WorldCupAward[]>> {
    const currentWorldCupId = await this.getCurrentWorldCupId();
    const result = await this.worldCupService.getAwardsById(currentWorldCupId, lang);
    return this.createOkResponse(result);
  }

  @Get('current/teams/:teamId/journey')
  @ApiOperation({
    summary: 'Get one team journey in current world cup',
    description:
      'Returns a simple path summary and match-by-match progression for a team in the current world cup.',
  })
  @ApiParam({ name: 'teamId', example: 'arg' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    example: 'en',
    description: 'Optional summary language. Defaults to en.',
  })
  @ApiOkResponse({ type: WorldCupTeamJourney })
  /**
   * Returns one team journey for current world cup.
   */
  async getCurrentTeamJourney(
    @Param('teamId') teamId: string,
    @Query('lang') lang?: string,
  ): Promise<ResponseObject<WorldCupTeamJourney>> {
    const result = await this.worldCupService.getCurrentTeamJourney(teamId, lang);
    return this.createOkResponse(result);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get world cup history ids',
    description: 'Returns world cup ids in reverse chronological order.',
  })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string' } } })
  /**
   * Returns historical world cup ids.
   */
  async getHistory(): Promise<ResponseObject<string[]>> {
    const result = await this.worldCupService.listHistoryIds();
    return this.createOkResponse(result);
  }

  @Get(':worldCupId')
  @ApiOperation({
    summary: 'Get world cup by id',
    description: 'Returns world cup metadata for the provided id.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiOkResponse({ type: WorldCup })
  /**
   * Returns world cup metadata by id.
   */
  async getById(@Param('worldCupId') worldCupId: string): Promise<ResponseObject<WorldCup>> {
    const result = await this.worldCupService.getWorldCupById(worldCupId);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/groups')
  @ApiOperation({
    summary: 'Get world cup group tables',
    description: 'Returns groups with standings for the selected world cup.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiOkResponse({ type: [WorldCupGroup] })
  /**
   * Returns group standings by world cup id.
   */
  async getGroups(@Param('worldCupId') worldCupId: string): Promise<ResponseObject<WorldCupGroup[]>> {
    const result = await this.worldCupService.getGroupsById(worldCupId);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/matches')
  @ApiOperation({
    summary: 'Get world cup matches',
    description: 'Returns full match list for the selected world cup. Optional filter by stage.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: WorldCupStage,
    example: WorldCupStage.GROUP_STAGE,
    description: 'Optional stage filter. If omitted, returns all stages.',
  })
  @ApiOkResponse({ type: [WorldCupMatch] })
  /**
   * Returns all tournament matches by world cup id.
   */
  async getMatches(
    @Param('worldCupId') worldCupId: string,
    @Query('stage') stage?: string,
  ): Promise<ResponseObject<WorldCupMatch[]>> {
    const result = await this.worldCupService.getMatchesById(worldCupId, stage);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/stats')
  @ApiOperation({
    summary: 'Get world cup aggregated stats',
    description: 'Returns tournament totals and top individual metrics. Available only when status is ENDED.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiOkResponse({ type: WorldCupStats })
  /**
   * Returns aggregated world cup stats.
   */
  async getStats(@Param('worldCupId') worldCupId: string): Promise<ResponseObject<WorldCupStats>> {
    const result = await this.worldCupService.getStatsById(worldCupId);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/player-stats')
  @ApiOperation({
    summary: 'Get world cup full player stats',
    description:
      'Returns full per-player tournament stats. Optional teamId filter. With teamId, returns full team roster including players with zero stats.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiQuery({
    name: 'teamId',
    required: false,
    example: 'arg',
    description: 'Optional team filter. If omitted, returns all players.',
  })
  @ApiOkResponse({ type: [WorldCupFullPlayerStat] })
  /**
   * Returns full player stats for one world cup with optional team filter.
   */
  async getPlayerStats(
    @Param('worldCupId') worldCupId: string,
    @Query('teamId') teamId?: string,
  ): Promise<ResponseObject<WorldCupFullPlayerStat[]>> {
    const result = await this.worldCupService.getPlayerStatsById(worldCupId, teamId);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/awards')
  @ApiOperation({
    summary: 'Get world cup awards',
    description:
      'Returns awards for completed world cups. If tournament has not ended, returns conflict. Supports localized reasons via `lang`.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    example: 'en',
    description: 'Optional language for award reason labels. Defaults to en.',
  })
  @ApiOkResponse({ type: [WorldCupAward] })
  /**
   * Returns world cup awards by id.
   */
  async getAwards(
    @Param('worldCupId') worldCupId: string,
    @Query('lang') lang?: string,
  ): Promise<ResponseObject<WorldCupAward[]>> {
    const result = await this.worldCupService.getAwardsById(worldCupId, lang);
    return this.createOkResponse(result);
  }

  @Get(':worldCupId/teams/:teamId/journey')
  @ApiOperation({
    summary: 'Get one team journey by world cup id',
    description:
      'Returns a simple path summary and match-by-match progression for a team in the selected world cup.',
  })
  @ApiParam({ name: 'worldCupId', example: 'wc_2026_123' })
  @ApiParam({ name: 'teamId', example: 'arg' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    example: 'en',
    description: 'Optional summary language. Defaults to en.',
  })
  @ApiOkResponse({ type: WorldCupTeamJourney })
  /**
   * Returns one team journey by world cup id.
   */
  async getTeamJourneyByWorldCupId(
    @Param('worldCupId') worldCupId: string,
    @Param('teamId') teamId: string,
    @Query('lang') lang?: string,
  ): Promise<ResponseObject<WorldCupTeamJourney>> {
    const result = await this.worldCupService.getTeamJourneyByWorldCupId(worldCupId, teamId, lang);
    return this.createOkResponse(result);
  }

  /**
   * Loads current world cup id to reuse id-based service queries.
   */
  private async getCurrentWorldCupId(): Promise<string> {
    const current = await this.worldCupService.getCurrentWorldCup();
    return current.worldCupId;
  }
}
