import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { TeamsService } from 'src/teams/teams.service';
import { WorldCupService } from 'src/world-cup/world-cup.service';
import { MatchEntity } from '../entity/match.entity';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../interfaces/match-localized-turn-message.interface';
import { MatchCurrentContext } from '../interfaces/match-current-context.interface';
import { MatchStartFinalHelperContract } from '../interfaces/match-start-final-helper.interface';
import { MatchAction } from '../model/match-action.enum';
import {
  DEFAULT_MATCH_LANGUAGE,
} from '../model/match-engine.constants';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchOption } from '../model/match-option.model';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchResponse } from '../model/match-response.model';
import { StartFinalRequest } from '../request/start-final.request';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';
import { MatchContextBuilderHelper } from './match-context-builder.helper';
import { LocalizedMessageBundle, MatchNarrativeHelper } from './match-narrative.helper';
import { MatchPersistenceHelper } from './match-persistence.helper';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { MatchResponseMapperHelper } from './match-response-mapper.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchTurnOptionsHelper } from './match-turn-options.helper';

@Injectable()
export class MatchStartFinalHelper
  extends AbstractMatchI18nHelper
  implements MatchStartFinalHelperContract
{
  private readonly actionsByEvent: Record<MatchEventType, MatchAction[]>;

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    private readonly teamsService: TeamsService,
    private readonly worldCupService: WorldCupService,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchTurnOptionsHelper: MatchTurnOptionsHelper,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly matchContextBuilderHelper: MatchContextBuilderHelper,
    private readonly matchPersistenceHelper: MatchPersistenceHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
  ) {
    super();
    this.actionsByEvent = this.matchRuntimeConfigHelper.loadActionsByEvent();
  }

  async startFinal(request: StartFinalRequest): Promise<MatchResponse> {
    const language = this.resolveLanguage(request.lang, this.matchRuntimeConfigHelper);
    const requestedTeamId = request.teamId?.trim().toLowerCase();

    const activeMatch = await this.matchRepository.findOne({
      where: { isActive: true, isFinished: false },
      order: { creationDate: 'DESC' },
    });

    if (activeMatch) {
      if (
        requestedTeamId &&
        requestedTeamId !== activeMatch.teamId &&
        requestedTeamId !== activeMatch.opponentId
      ) {
        throw new BadRequestException(ApiErrorCode.BAD_REQUEST);
      }

      activeMatch.strategy = await this.teamsService.getTeamStrategyValue(activeMatch.teamId);
      activeMatch.formation = await this.teamsService.getTeamFormationValue(activeMatch.teamId);
      activeMatch.opponentStrategy =
        this.matchTacticalHelper.parseStrategy(activeMatch.opponentStrategy) ||
        (await this.teamsService.getTeamStrategyValue(activeMatch.opponentId));
      activeMatch.opponentFormation =
        this.matchTacticalHelper.parseFormation(activeMatch.opponentFormation) ||
        (await this.teamsService.getTeamFormationValue(activeMatch.opponentId));

      const shouldReplayKickoffMessages = this.shouldReplayKickoffMessages(activeMatch);
      const isRivalryMatch = await this.teamsService.areTeamsRivals(
        activeMatch.teamId,
        activeMatch.opponentId,
      );
      const activeStartMessages = shouldReplayKickoffMessages
        ? this.matchNarrativeHelper.buildStartMessages({
            teamName: activeMatch.teamName,
            teamFormation: this.matchTacticalHelper.parseFormation(activeMatch.formation),
            opponentName: activeMatch.opponentName,
            opponentFormation: this.matchTacticalHelper.parseFormation(activeMatch.opponentFormation),
            ballCarrierName: activeMatch.ballCarrierName || activeMatch.teamCaptainName || activeMatch.teamName,
            isRivalryMatch,
          })
        : null;
      const activeLocalizedStartMessages = activeStartMessages
        ? this.matchNarrativeHelper.pickMessagesByLanguage(activeStartMessages, language)
        : [];
      if (activeLocalizedStartMessages.length > 0) {
        activeMatch.message = activeLocalizedStartMessages[0];
      }

      const updatedActiveMatch = await this.matchRepository.save(activeMatch);
      await this.worldCupService.markFinalActive(
        updatedActiveMatch.matchId,
        updatedActiveMatch.teamId,
        updatedActiveMatch.opponentId,
      );

      if (activeStartMessages) {
        return await this.toMatchResponse(
          updatedActiveMatch,
          language,
          this.localizeMessageItems(
            this.buildStartMessageItems({
              bundle: activeStartMessages,
              isRivalryMatch,
              minute: updatedActiveMatch.minute,
              turn: updatedActiveMatch.turn,
              teamId: updatedActiveMatch.teamId,
              teamName: updatedActiveMatch.teamName,
              ballCarrierName: updatedActiveMatch.ballCarrierName || null,
            }),
            language,
          ),
        );
      }

      return await this.toMatchResponse(updatedActiveMatch, language);
    }

    const readyFinalData = await this.worldCupService.ensureReadyFinalForTeam(requestedTeamId);
    const selectedTeam = readyFinalData.selectedTeam;
    const fixedOpponent = readyFinalData.opponent;
    const normalizedTeamId = selectedTeam.teamId;
    const opponentId = fixedOpponent.teamId;
    const opponentName = fixedOpponent.name;
    const opponentCaptain = fixedOpponent.captain;
    const opponentStrategy = fixedOpponent.strategy;
    const opponentFormation = fixedOpponent.formation;

    const userPlayers = await this.teamsService.getTeamPlayers(normalizedTeamId);
    const opponentPlayers = await this.teamsService.getTeamPlayers(opponentId);
    const matchId = `final_${uuidv4()}`;

    await this.matchSquadRulesHelper.initializeMatchSquad(
      matchId,
      normalizedTeamId,
      selectedTeam.captain,
      userPlayers,
      selectedTeam.formation,
      selectedTeam.strategy,
    );
    await this.matchSquadRulesHelper.initializeMatchSquad(
      matchId,
      opponentId,
      opponentCaptain,
      opponentPlayers,
      opponentFormation,
      opponentStrategy,
    );

    const userOnField = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      matchId,
      normalizedTeamId,
    );
    const opponentOnField = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      matchId,
      opponentId,
    );
    const initialBallCarrier = this.pickPlayerForAction(
      userOnField.length ? userOnField : userPlayers,
      MatchAction.PASS,
      MatchFieldZone.MIDFIELD,
    );

    const eventType = MatchEventType.KICKOFF_EVENT;
    const isRivalryMatch = await this.teamsService.areTeamsRivals(normalizedTeamId, opponentId);
    const initialOptions = this.matchTurnOptionsHelper.buildOptions({
      eventType,
      language: DEFAULT_MATCH_LANGUAGE,
      possession: MatchPossession.USER,
      zone: MatchFieldZone.MIDFIELD,
      actionsByEvent: this.actionsByEvent,
    });
    const startMessages = this.matchNarrativeHelper.buildStartMessages({
      teamName: selectedTeam.name,
      teamFormation: selectedTeam.formation,
      opponentName,
      opponentFormation,
      ballCarrierName: initialBallCarrier.name,
      isRivalryMatch,
    });
    const kickoffMessageIndex = startMessages.en.length - 1;
    const localizedStartMessages = this.matchNarrativeHelper.pickMessagesByLanguage(
      startMessages,
      language,
    );

    const newMatch = this.matchRepository.create({
      matchId,
      teamId: normalizedTeamId,
      teamName: selectedTeam.name,
      teamCoachName: selectedTeam.coach,
      teamCaptainName: selectedTeam.captain,
      opponentId,
      opponentName,
      opponentCoachName: fixedOpponent.coach,
      opponentCaptainName: fixedOpponent.captain,
      scoreTeam: 0,
      scoreOpponent: 0,
      minute: 1,
      turn: 1,
      maxTurns: this.matchRuntimeConfigHelper.loadMaxTurnsPerMatch(),
      maxSubstitutions: this.matchRuntimeConfigHelper.loadMaxSubstitutionsPerTeam(),
      teamSubstitutionsUsed: 0,
      opponentSubstitutionsUsed: 0,
      opponentStrategyChangesUsed: 0,
      opponentLastTacticalChangeTurn: 0,
      currentZone: MatchFieldZone.MIDFIELD,
      possessionTeam: MatchPossession.USER,
      ballCarrierTeamId: normalizedTeamId,
      ballCarrierName: initialBallCarrier.name,
      teamAttackPenalty: 0,
      teamMidfieldPenalty: 0,
      teamDefensePenalty: 0,
      opponentAttackPenalty: 0,
      opponentMidfieldPenalty: 0,
      opponentDefensePenalty: 0,
      teamMoraleBoostTurns: 0,
      teamMoralePenaltyTurns: 0,
      opponentMoraleBoostTurns: 0,
      opponentMoralePenaltyTurns: 0,
      strategy: selectedTeam.strategy,
      formation: selectedTeam.formation,
      opponentStrategy,
      opponentFormation,
      eventType,
      message: localizedStartMessages[0] || startMessages.en[0],
      optionsJson: JSON.stringify(initialOptions),
      isFinished: false,
      isActive: true,
    });

    const savedMatch = await this.matchRepository.save(newMatch);
    const initialTacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
      strategy: savedMatch.strategy,
      formation: savedMatch.formation,
      opponentStrategy: savedMatch.opponentStrategy,
      opponentFormation: savedMatch.opponentFormation,
    });
    const initialContext: MatchCurrentContext = await this.matchContextBuilderHelper.buildContext({
      match: savedMatch,
      eventType,
      zone: MatchFieldZone.MIDFIELD,
      possession: MatchPossession.USER,
      actingPlayer: initialBallCarrier,
      availableActions: initialOptions.map((option) => option.action),
      actionsByEvent: this.actionsByEvent,
      tacticalSnapshot: initialTacticalSnapshot,
      userPlayers: userOnField.length ? userOnField : userPlayers,
      opponentPlayers: opponentOnField.length ? opponentOnField : opponentPlayers,
      isPendingSetPiece: false,
      lastAction: MatchAction.PASS,
      lastOutcome: 'KICKOFF',
    });
    savedMatch.lastContextJson = JSON.stringify(initialContext);
    await this.matchPersistenceHelper.recordMatchTurnContext({
      matchId: savedMatch.matchId,
      turn: savedMatch.turn,
      minute: savedMatch.minute,
      phase: 'START',
      selectedAction: MatchAction.PASS,
      actionOutcome: null,
      headline: localizedStartMessages[0] || startMessages.en[0],
      context: initialContext,
    });
    const savedMatchWithContext = await this.matchRepository.save(savedMatch);
    await this.worldCupService.markFinalActive(
      savedMatchWithContext.matchId,
      savedMatchWithContext.teamId,
      savedMatchWithContext.opponentId,
    );

    await this.matchPersistenceHelper.recordMatchStat({
      matchId: savedMatch.matchId,
      minute: savedMatch.minute,
      turn: savedMatch.turn,
      eventType: MatchEventType.KICKOFF_EVENT,
      zone: MatchFieldZone.MIDFIELD,
      action: MatchAction.PASS,
      teamId: savedMatch.teamId,
      teamName: savedMatch.teamName,
      playerName: initialBallCarrier.name,
      playerPosition: initialBallCarrier.position,
      cardType: null,
      isGoal: false,
      message: localizedStartMessages[kickoffMessageIndex] || startMessages.en[kickoffMessageIndex],
      messageKey: 'match.start.kickoff',
      messageParams: {
        ballCarrierName: initialBallCarrier.name,
      },
    });

    return await this.toMatchResponse(
      savedMatchWithContext,
      language,
      this.localizeMessageItems(
        this.buildStartMessageItems({
          bundle: startMessages,
          isRivalryMatch,
          minute: savedMatchWithContext.minute,
          turn: savedMatchWithContext.turn,
          teamId: savedMatchWithContext.teamId,
          teamName: savedMatchWithContext.teamName,
          ballCarrierName: initialBallCarrier.name,
        }),
        language,
      ),
      initialContext,
    );
  }

  private buildStartMessageItems(params: {
    bundle: LocalizedMessageBundle;
    isRivalryMatch: boolean;
    minute: number;
    turn: number;
    teamId: string;
    teamName: string;
    ballCarrierName: string | null;
  }): LocalizedTurnMessageItem[] {
    const keys: string[] = ['match.start.header'];
    if (params.isRivalryMatch) {
      keys.push('match.start.rivalry');
    }
    keys.push('match.start.kickoff');

    return keys.map((key, index) => ({
      key,
      type: key === 'match.start.kickoff' ? MatchMessageType.RESTART : MatchMessageType.INFO,
      en: params.bundle.en[index] || params.bundle.en[0] || '',
      es: params.bundle.es[index] || params.bundle.es[0] || '',
      minute: params.minute,
      turn: params.turn,
      teamId: params.teamId,
      teamName: params.teamName,
      playerName: key === 'match.start.kickoff' ? params.ballCarrierName : null,
    }));
  }

  private pickPlayerForAction(players: TeamPlayer[], action: MatchAction, zone: MatchFieldZone): TeamPlayer {
    return this.matchPlayerSelectionHelper.pickPlayerForAction(players, action, zone);
  }

  private localizeMessageItems(
    items: LocalizedTurnMessageItem[],
    language: MatchLanguage,
  ): MatchMessageItem[] {
    return items.map((item) => ({
      type: item.type,
      text: language === 'es' ? item.es : item.en,
      minute: item.minute ?? 0,
      turn: item.turn ?? 0,
      teamId: item.teamId ?? null,
      teamName: item.teamName ?? null,
      playerName: item.playerName ?? null,
    }));
  }

  private shouldReplayKickoffMessages(match: MatchEntity): boolean {
    return (
      !match.isFinished &&
      match.turn <= 1 &&
      match.minute <= 1 &&
      (match.eventType as MatchEventType) === MatchEventType.KICKOFF_EVENT &&
      match.scoreTeam === 0 &&
      match.scoreOpponent === 0
    );
  }

  private async toMatchResponse(
    match: MatchEntity,
    language: MatchLanguage = DEFAULT_MATCH_LANGUAGE,
    messageItems?: MatchMessageItem[],
    currentContext?: MatchCurrentContext | null,
  ): Promise<MatchResponse> {
    const coachMetadata = await this.resolveCoachMetadata(match);
    return this.matchResponseMapperHelper.buildMatchResponse({
      match,
      language,
      coachMetadata,
      optionsJson: match.optionsJson,
      messageItems,
      currentContext,
    });
  }

  private async resolveCoachMetadata(match: MatchEntity): Promise<{
    teamCoachName: string | null;
    teamCoachProfile: CoachProfile | null;
    opponentCoachName: string | null;
    opponentCoachProfile: CoachProfile | null;
  }> {
    try {
      const [teamCoach, opponentCoach] = await Promise.all([
        this.teamsService.getTeamCoachIdentity(match.teamId),
        this.teamsService.getTeamCoachIdentity(match.opponentId),
      ]);

      return {
        teamCoachName: teamCoach.name || match.teamCoachName || null,
        teamCoachProfile: teamCoach.profile,
        opponentCoachName: opponentCoach.name || match.opponentCoachName || null,
        opponentCoachProfile: opponentCoach.profile,
      };
    } catch {
      return {
        teamCoachName: match.teamCoachName || null,
        teamCoachProfile: null,
        opponentCoachName: match.opponentCoachName || null,
        opponentCoachProfile: null,
      };
    }
  }
}
