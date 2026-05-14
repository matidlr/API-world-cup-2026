import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { MatchEntity } from '../entity/match.entity';
import { MatchPlayPrepareHelperContract } from '../interfaces/match-play-prepare.interface';
import { MatchPlayStageContext } from '../interfaces/match-play-stage.interface';
import { PlayRequest } from '../request/play.request';
import { MatchLanguage } from '../model/match-language.model';
import { MatchResponseMapperHelper } from './match-response-mapper.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { TeamsService } from 'src/teams/teams.service';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchOption } from '../model/match-option.model';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';
import { MatchEnginePreparePlayResult, UserTacticalShift } from '../interfaces/match-engine.interface';

@Injectable()
export class MatchPlayPrepareHelper
  extends AbstractMatchI18nHelper
  implements MatchPlayPrepareHelperContract
{
  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    private readonly teamsService: TeamsService,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchTacticalHelper: MatchTacticalHelper,
  ) {
    super();
  }

  async prepare(request: PlayRequest): Promise<MatchPlayStageContext> {
    const language = this.resolveLanguage(request.lang, this.matchRuntimeConfigHelper);
    const match = await this.getActiveMatch();
    const previousStrategy = this.matchTacticalHelper.parseStrategy(match.strategy);
    const previousFormation = this.matchTacticalHelper.parseFormation(match.formation);

    const currentStrategy = await this.teamsService.getTeamStrategyValue(match.teamId);
    const currentFormation = await this.teamsService.getTeamFormationValue(match.teamId);
    const opponentStrategy =
      this.matchTacticalHelper.parseStrategy(match.opponentStrategy) ||
      (await this.teamsService.getTeamStrategyValue(match.opponentId));
    const opponentFormation =
      this.matchTacticalHelper.parseFormation(match.opponentFormation) ||
      (await this.teamsService.getTeamFormationValue(match.opponentId));

    match.strategy = currentStrategy;
    match.formation = currentFormation;
    match.opponentStrategy = opponentStrategy;
    match.opponentFormation = opponentFormation;

    const currentOptions = this.safeParseOptions(match.optionsJson);
    const selectedOption = currentOptions.find((option) => option.index === request.selectedOption);
    if (!selectedOption) {
      throw new BadRequestException(ApiErrorCode.INVALID_SELECTED_OPTION);
    }

    const baseUserPlayers = await this.teamsService.getTeamPlayers(match.teamId);
    const baseOpponentPlayers = await this.teamsService.getTeamPlayers(match.opponentId);
    const userPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(match.matchId, match.teamId);
    const opponentPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      match.matchId,
      match.opponentId,
    );

    const tacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
      strategy: currentStrategy,
      formation: currentFormation,
      opponentStrategy,
      opponentFormation,
    });

    const currentEventType = match.eventType as MatchEventType;
    const isExecutingRegularPenalty = this.isRegularPenaltyEvent(currentEventType);
    const userTacticalShift = this.resolveUserTacticalShift({
      previousStrategy,
      previousFormation,
      strategy: currentStrategy,
      formation: currentFormation,
    });

    const preparedTurn: MatchEnginePreparePlayResult = {
      language,
      match,
      currentStrategy,
      currentFormation,
      opponentStrategy,
      opponentFormation,
      selectedOption,
      baseUserPlayers,
      baseOpponentPlayers,
      userPlayers,
      opponentPlayers,
      tacticalSnapshot,
      currentEventType,
      isExecutingRegularPenalty,
      userTacticalShift,
    };

    return {
      request,
      preparedTurn,
      selectedAction: selectedOption.action,
    };
  }

  private isRegularPenaltyEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.PENALTY_FOR_EVENT ||
      eventType === MatchEventType.PENALTY_AGAINST_EVENT
    );
  }

  private resolveUserTacticalShift(input: {
    previousStrategy: MatchEnginePreparePlayResult['currentStrategy'];
    previousFormation: MatchEnginePreparePlayResult['currentFormation'];
    strategy: MatchEnginePreparePlayResult['currentStrategy'];
    formation: MatchEnginePreparePlayResult['currentFormation'];
  }): UserTacticalShift | null {
    const { previousStrategy, previousFormation, strategy, formation } = input;
    if (!previousStrategy || !previousFormation || !strategy || !formation) {
      return null;
    }

    if (previousStrategy === strategy && previousFormation === formation) {
      return null;
    }

    return {
      previousStrategy,
      previousFormation,
      strategy,
      formation,
    };
  }

  private async getActiveMatch(): Promise<MatchEntity> {
    const match = await this.matchRepository.findOne({
      where: { isActive: true, isFinished: false },
      order: { creationDate: 'DESC' },
    });

    if (!match) {
      throw new BadRequestException(ApiErrorCode.ACTIVE_FINAL_NOT_FOUND);
    }

    return match;
  }

  private safeParseOptions(optionsJson: string): MatchOption[] {
    return this.matchResponseMapperHelper.safeParseOptions(optionsJson);
  }
}
