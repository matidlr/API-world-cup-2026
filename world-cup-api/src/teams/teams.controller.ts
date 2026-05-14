import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AbstractController } from 'src/basic/abstract.controller';
import { ResponseObject } from 'src/basic/response-object';
import { Coach } from './model/coach.model';
import { RivalTeam } from './model/rival-team.model';
import { TeamFormation } from './model/team-formation.model';
import { TeamHistory } from './model/team-history.model';
import { TeamTitleAchievement } from './model/team-history.model';
import { TeamPlayer } from './model/team-player.model';
import { TeamStats } from './model/team-stats.model';
import { TeamStrategy } from './model/team-strategy.model';
import { Team } from './model/team.model';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@ApiExtraModels(TeamHistory, TeamTitleAchievement)
@Controller('teams')
/**
 * HTTP layer for team endpoints consumed by BFF/backoffice clients.
 */
export class TeamsController extends AbstractController {
  constructor(private readonly teamsService: TeamsService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'List teams or filter by team id/name',
    description:
      'Returns all teams. Optional filters: exact `teamId` and partial case-insensitive `name`. When both are provided, both conditions are applied.',
  })
  @ApiOkResponse({ type: [Team] })
  @ApiQuery({ name: 'teamId', required: false, description: 'Team id exact filter (case-insensitive)' })
  @ApiQuery({ name: 'name', required: false, description: 'Team name filter (partial match)' })
  /**
   * Returns all teams or a filtered subset.
   */
  async listTeams(
    @Query('teamId') teamId?: string,
    @Query('name') name?: string,
  ): Promise<ResponseObject<Team[]>> {
    const teams = await this.teamsService.listTeams({ teamId, name });
    return this.createOkResponse(teams);
  }

  @Get('coaches')
  @ApiOperation({
    summary: 'List coaches or filter by team id / nationality',
    description:
      'Returns all coaches. Optional filters: exact `teamId` and partial case-insensitive `nationality`. When both are provided, both conditions are applied.',
  })
  @ApiOkResponse({ type: [Coach] })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: 'Optional exact team id filter. Example: arg',
    example: 'arg',
  })
  @ApiQuery({
    name: 'nationality',
    required: false,
    description: 'Optional nationality filter (partial, case-insensitive). Example: argentina, españa',
    example: 'argentina',
  })
  /**
   * Returns all coaches or a filtered subset by team id and/or nationality.
   */
  async listCoaches(
    @Query('teamId') teamId?: string,
    @Query('nationality') nationality?: string,
  ): Promise<ResponseObject<Coach[]>> {
    const coaches = await this.teamsService.listCoaches({ teamId, nationality });
    return this.createOkResponse(coaches);
  }

  @Get(':teamId/stats')
  @ApiOperation({
    summary: 'Get team stats by id',
    description: 'Returns attack/defense/midfield/overall and current strategy/formation context.',
  })
  @ApiOkResponse({ type: TeamStats })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns aggregate stats for one team.
   */
  async getTeamStats(@Param('teamId') teamId: string): Promise<ResponseObject<TeamStats>> {
    const stats = await this.teamsService.getTeamStats(teamId);
    return this.createOkResponse(stats);
  }

  @Get(':teamId/players')
  @ApiOperation({
    summary: 'Get team players by id',
    description: 'Returns the team squad list for the provided team id.',
  })
  @ApiOkResponse({ type: [TeamPlayer] })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns squad players for a team.
   */
  async getTeamPlayers(@Param('teamId') teamId: string): Promise<ResponseObject<TeamPlayer[]>> {
    const players = await this.teamsService.getTeamPlayers(teamId);
    return this.createOkResponse(players);
  }

  @Get(':teamId/history')
  @ApiOperation({
    summary: 'Get team history by id',
    description: 'Returns World Cups and titles for the selected team.',
  })
  @ApiOkResponse({ type: TeamHistory })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns historical records for a team.
   */
  async getTeamHistory(@Param('teamId') teamId: string): Promise<ResponseObject<TeamHistory>> {
    const history = await this.teamsService.getTeamHistory(teamId);
    return this.createOkResponse(history);
  }

  @Get(':teamId/rivals')
  @ApiOperation({
    summary: 'Get rivals by id',
    description: 'Returns rival teams used by exploration/chat navigation flows.',
  })
  @ApiOkResponse({ type: [RivalTeam] })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns rival teams for exploration.
   */
  async getRivals(@Param('teamId') teamId: string): Promise<ResponseObject<RivalTeam[]>> {
    const rivals = await this.teamsService.getRivals(teamId);
    return this.createOkResponse(rivals);
  }

  @Get(':teamId/strategy')
  @ApiOperation({
    summary: 'Get team strategy by id',
    description: 'Returns the currently configured strategy for the team.',
  })
  @ApiOkResponse({ type: TeamStrategy })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns strategy configuration for a team.
   */
  async getTeamStrategy(@Param('teamId') teamId: string): Promise<ResponseObject<TeamStrategy>> {
    const strategy = await this.teamsService.getTeamStrategy(teamId);
    return this.createOkResponse(strategy);
  }

  @Get(':teamId/formation')
  @ApiOperation({
    summary: 'Get team formation by id',
    description: 'Returns the currently configured formation for the team.',
  })
  @ApiOkResponse({ type: TeamFormation })
  @ApiParam({ name: 'teamId', example: 'arg' })
  /**
   * Returns formation configuration for a team.
   */
  async getTeamFormation(@Param('teamId') teamId: string): Promise<ResponseObject<TeamFormation>> {
    const formation = await this.teamsService.getTeamFormation(teamId);
    return this.createOkResponse(formation);
  }
}
