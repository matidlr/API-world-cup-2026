import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiErrorCode } from 'src/shared/error/api-error-code.enum';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { TeamsService } from 'src/teams/teams.service';
import { I18nService, TranslationParams } from 'src/i18n/i18n.service';
import { WorldCupService } from 'src/world-cup/world-cup.service';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { MatchEntity } from '../entity/match.entity';
import {
  MatchPlaySpecialEventResponseHelperContract,
} from '../interfaces/match-play-special-event-response.interface';
import { MatchEnginePreparePlayResult } from '../interfaces/match-engine.interface';
import {
  LocalizedTurnMessageItem,
  LocalizedTurnMessages,
} from '../interfaces/match-localized-turn-message.interface';
import {
  MatchCurrentContext,
} from '../interfaces/match-service.interfaces';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchCardType } from '../model/match-card-type.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchMessageItem } from '../model/match-message-item.model';
import { MatchMessageType } from '../model/match-message-type.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchResponse } from '../model/match-response.model';
import {
  DEFAULT_MATCH_LANGUAGE,
} from '../model/match-engine.constants';
import { MatchActionOutcomeHelper } from './match-action-outcome.helper';
import { MatchFinalMessageHelper } from './match-final-message.helper';
import { MatchNarrativeHelper } from './match-narrative.helper';
import { MatchPersistenceHelper } from './match-persistence.helper';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { MatchResponseMapperHelper } from './match-response-mapper.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { MatchSquadRulesHelper } from './match-squad-rules.helper';
import { MatchTacticalHelper } from './match-tactical.helper';
import { MatchTurnFlowHelper } from './match-turn-flow.helper';
import { MatchTurnMessageHelper } from './match-turn-message.helper';
import { MatchTurnOptionsHelper } from './match-turn-options.helper';
import { MatchTurnOrchestratorHelper } from './match-turn-orchestrator.helper';
import { MatchTurnOutputHelper } from './match-turn-output.helper';
import { AbstractMatchI18nHelper } from './abstract-match-i18n.helper';
import { MatchOutcomeMessageHelper } from './match-outcome-message.helper';
import { MatchOutcomeNarrativeMode } from '../interfaces/match-outcome-message.interface';

@Injectable()
export class MatchPlaySpecialEventResponseHelper
  extends AbstractMatchI18nHelper
  implements MatchPlaySpecialEventResponseHelperContract
{
  private readonly actionsByEvent: Record<MatchEventType, MatchAction[]>;
  private readonly maxMessagesPerTurn: number;

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    private readonly teamsService: TeamsService,
    private readonly i18nService: I18nService,
    private readonly worldCupService: WorldCupService,
    private readonly matchNarrativeHelper: MatchNarrativeHelper,
    private readonly matchActionOutcomeHelper: MatchActionOutcomeHelper,
    private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper,
    private readonly matchTurnMessageHelper: MatchTurnMessageHelper,
    private readonly matchTurnOptionsHelper: MatchTurnOptionsHelper,
    private readonly matchTacticalHelper: MatchTacticalHelper,
    private readonly matchTurnFlowHelper: MatchTurnFlowHelper,
    private readonly matchPersistenceHelper: MatchPersistenceHelper,
    private readonly matchFinalMessageHelper: MatchFinalMessageHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
    private readonly matchSquadRulesHelper: MatchSquadRulesHelper,
    private readonly matchTurnOrchestratorHelper: MatchTurnOrchestratorHelper,
    private readonly matchTurnOutputHelper: MatchTurnOutputHelper,
    private readonly matchOutcomeMessageHelper: MatchOutcomeMessageHelper,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
  ) {
    super();
    this.actionsByEvent = this.matchRuntimeConfigHelper.loadActionsByEvent();
    this.maxMessagesPerTurn = this.matchRuntimeConfigHelper.loadMaxMessagesPerTurn();
  }

  async resolveQuitMatch(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse> {
    const { language, match } = preparedTurn;
    const turnMessageAccumulator = this.matchTurnMessageHelper.createAccumulator(match);
    const turnMessages: LocalizedTurnMessages = turnMessageAccumulator.bundle;
    const turnMessageItems: LocalizedTurnMessageItem[] = turnMessageAccumulator.items;
    const pushTurnMessage = turnMessageAccumulator.pushTurnMessage;

    this.matchTurnOrchestratorHelper.applyForfeitState(match);
    pushTurnMessage(MatchMessageType.FINAL, 'match.forfeit.line1', { teamName: match.teamName });
    pushTurnMessage(MatchMessageType.FINAL, 'match.forfeit.line2', { opponentName: match.opponentName });

    const { headline: forfeitHeadline, messageItems: forfeitMessageItems } =
      this.matchTurnOutputHelper.finalizeTurnOutput({
      bundle: turnMessages,
      localizedItems: turnMessageItems,
      match,
      language,
      fallbackFinalMessage: this.buildFinalMessageLocalized(match, language),
      maxMessagesPerTurn: this.maxMessagesPerTurn,
    });
    match.message = forfeitHeadline;
    match.optionsJson = JSON.stringify([]);

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType: MatchEventType.FORFEIT_EVENT,
      zone: (match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD,
      action: MatchAction.QUIT_MATCH,
      teamId: match.teamId,
      teamName: match.teamName,
      playerName: match.ballCarrierName,
      playerPosition: null,
      cardType: null,
      isGoal: false,
      message: forfeitHeadline,
    });

    const savedForfeit = await this.matchRepository.save(match);
    await this.worldCupService.markFinalEnded(savedForfeit);
    return await this.toMatchResponse(savedForfeit, language, forfeitMessageItems);
  }

  async resolveHalfTimeRestart(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse> {
    const { language, match, selectedOption } = preparedTurn;

    if (selectedOption.action !== MatchAction.RESTART_MATCH) {
      throw new BadRequestException(ApiErrorCode.INVALID_SELECTED_OPTION);
    }

    const turnMessageAccumulator = this.matchTurnMessageHelper.createAccumulator(match);
    const turnMessages: LocalizedTurnMessages = turnMessageAccumulator.bundle;
    const turnMessageItems: LocalizedTurnMessageItem[] = turnMessageAccumulator.items;
    const pushTurnMessage = turnMessageAccumulator.pushTurnMessage;

    const baseUserPlayers = await this.teamsService.getTeamPlayers(match.teamId);
    const baseOpponentPlayers = await this.teamsService.getTeamPlayers(match.opponentId);
    const userPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(match.matchId, match.teamId);
    const opponentPlayers = await this.matchSquadRulesHelper.getMatchOnFieldPlayers(
      match.matchId,
      match.opponentId,
    );
    const restartPlayer = this.pickPlayerForAction(
      opponentPlayers.length ? opponentPlayers : baseOpponentPlayers,
      MatchAction.PASS,
      MatchFieldZone.MIDFIELD,
    );

    match.minute = Math.max(46, match.minute);
    match.eventType = MatchEventType.KICKOFF_EVENT;
    match.possessionTeam = MatchPossession.OPPONENT;
    match.currentZone = MatchFieldZone.MIDFIELD;
    match.ballCarrierTeamId = match.opponentId;
    match.ballCarrierName = restartPlayer.name;

    pushTurnMessage(
      MatchMessageType.RESTART,
      'match.halftime.secondHalfKickoff',
      { teamName: match.opponentName },
      {
        minute: match.minute,
        turn: match.turn,
        teamId: match.opponentId,
        teamName: match.opponentName,
        playerName: restartPlayer.name,
      },
    );

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType: MatchEventType.KICKOFF_EVENT,
      zone: MatchFieldZone.MIDFIELD,
      action: MatchAction.PASS,
      teamId: match.opponentId,
      teamName: match.opponentName,
      playerName: restartPlayer.name,
      playerPosition: restartPlayer.position,
      cardType: null,
      isGoal: false,
      message: turnMessages.en[turnMessages.en.length - 1],
      messageKey: 'match.halftime.secondHalfKickoff',
      messageParams: {
        teamName: match.opponentName,
      },
    });

    const nextOptions = this.matchTurnOptionsHelper.buildOptions({
      eventType: match.eventType as MatchEventType,
      language: DEFAULT_MATCH_LANGUAGE,
      possession: MatchPossession.OPPONENT,
      zone: match.currentZone as MatchFieldZone,
      actionsByEvent: this.actionsByEvent,
    });
    match.optionsJson = JSON.stringify(nextOptions);

    const tacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
      strategy: this.matchTacticalHelper.parseStrategy(match.strategy),
      formation: this.matchTacticalHelper.parseFormation(match.formation),
      opponentStrategy: this.matchTacticalHelper.parseStrategy(match.opponentStrategy),
      opponentFormation: this.matchTacticalHelper.parseFormation(match.opponentFormation),
    });

    const responseContext = await this.matchTurnFlowHelper.buildResponseContext({
      match,
      tacticalSnapshot,
      userPlayers: userPlayers.length ? userPlayers : baseUserPlayers,
      opponentPlayers: opponentPlayers.length ? opponentPlayers : baseOpponentPlayers,
      options: nextOptions,
      lastAction: selectedOption.action,
      lastOutcome: null,
      isPendingSetPiece: false,
    });
    match.lastContextJson = JSON.stringify(responseContext);

    const { headline: restartHeadline, messageItems: restartMessageItems } =
      this.matchTurnOutputHelper.finalizeTurnOutput({
      bundle: turnMessages,
      localizedItems: turnMessageItems,
      match,
      language,
      fallbackFinalMessage: this.buildFinalMessageLocalized(match, language),
      maxMessagesPerTurn: this.maxMessagesPerTurn,
    });
    match.message = restartHeadline;

    await this.recordMatchTurnContext({
      matchId: match.matchId,
      turn: match.turn,
      minute: match.minute,
      phase: 'TURN',
      selectedAction: selectedOption.action,
      actionOutcome: null,
      headline: restartHeadline,
      context: responseContext,
    });

    const savedRestart = await this.matchRepository.save(match);
    return await this.toMatchResponse(savedRestart, language, restartMessageItems, responseContext);
  }

  async resolveLastPlayEvent(preparedTurn: MatchEnginePreparePlayResult): Promise<MatchResponse> {
    const { language, match, selectedOption, userPlayers, opponentPlayers, baseUserPlayers, baseOpponentPlayers } =
      preparedTurn;
    const turnMessageAccumulator = this.matchTurnMessageHelper.createAccumulator(match);
    const turnMessages: LocalizedTurnMessages = turnMessageAccumulator.bundle;
    const turnMessageItems: LocalizedTurnMessageItem[] = turnMessageAccumulator.items;
    const pushTurnMessage = turnMessageAccumulator.pushTurnMessage;

    return this.resolveLastPlayTurn({
      match,
      selectedAction: selectedOption.action,
      language,
      turnMessages,
      turnMessageItems,
      pushTurnMessage,
      userPlayers: userPlayers.length ? userPlayers : baseUserPlayers,
      opponentPlayers: opponentPlayers.length ? opponentPlayers : baseOpponentPlayers,
    });
  }

  private async resolveLastPlayTurn(params: {
    match: MatchEntity;
    selectedAction: MatchAction;
    language: MatchLanguage;
    turnMessages: LocalizedTurnMessages;
    turnMessageItems: LocalizedTurnMessageItem[];
    pushTurnMessage?: (
      type: MatchMessageType,
      key: string,
      payload?: any,
      metadata?: {
        minute?: number;
        turn?: number;
        teamId?: string | null;
        teamName?: string | null;
        playerName?: string | null;
      },
    ) => void;
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
  }): Promise<MatchResponse> {
    const {
      match,
      selectedAction,
      language,
      turnMessages,
      turnMessageItems,
      pushTurnMessage,
      userPlayers,
      opponentPlayers,
    } = params;
    const pushTurnMessageSafe =
      pushTurnMessage ||
      ((type: MatchMessageType, key: string, payload?: any, metadata?: any) => {
        const en = this.i18nService.t(
          key,
          'en',
          typeof payload === 'function' ? payload('en') : payload || {},
        );
        const es = this.i18nService.t(
          key,
          'es',
          typeof payload === 'function' ? payload('es') : payload || {},
        );
        turnMessages.en.push(en);
        turnMessages.es.push(es);
        turnMessageItems.push({
          type,
          en,
          es,
          minute: metadata?.minute ?? match.minute,
          turn: metadata?.turn ?? match.turn,
          teamId: metadata?.teamId ?? null,
          teamName: metadata?.teamName ?? null,
          playerName: metadata?.playerName ?? null,
        });
      });
    const eventType = match.eventType as MatchEventType;
    const attackingSide = this.isLastPlayForEvent(eventType)
      ? MatchPossession.USER
      : MatchPossession.OPPONENT;
    const attackingPlayers = attackingSide === MatchPossession.USER ? userPlayers : opponentPlayers;
    const attackingTeamId =
      attackingSide === MatchPossession.USER ? match.teamId : match.opponentId;
    const attackingTeamName =
      attackingSide === MatchPossession.USER ? match.teamName : match.opponentName;
    const actingPlayer =
      attackingPlayers.find(
        (player) =>
          player.name.trim().toLowerCase() === (match.ballCarrierName || '').trim().toLowerCase(),
      ) ||
      this.pickPlayerForAction(
        attackingPlayers,
        this.isLastPlayPenaltyEvent(eventType) ? MatchAction.LEFT : MatchAction.SHOOT,
        MatchFieldZone.BOX,
      );
    const turnContext = {
      action: selectedAction,
      eventType,
      possession: attackingSide,
      zone: MatchFieldZone.BOX,
      actingTeamId: attackingTeamId,
      actingTeamName: attackingTeamName,
      actingPlayer,
    };
    const selectedActionPlayer = this.isLastPlayForEvent(eventType)
      ? actingPlayer
      : this.pickPlayerForAction(userPlayers, selectedAction, MatchFieldZone.BOX);

    const tacticalSnapshot = this.matchTacticalHelper.buildTacticalSnapshot({
      strategy: this.matchTacticalHelper.parseStrategy(match.strategy),
      formation: this.matchTacticalHelper.parseFormation(match.formation),
      opponentStrategy: this.matchTacticalHelper.parseStrategy(match.opponentStrategy),
      opponentFormation: this.matchTacticalHelper.parseFormation(match.opponentFormation),
    });
    const currentOptions = this.matchTurnOptionsHelper.buildOptions({
      eventType,
      language,
      possession: attackingSide,
      zone: MatchFieldZone.BOX,
      actionsByEvent: this.actionsByEvent,
    });
    const currentContext = await this.matchTurnFlowHelper.buildResponseContext({
      match,
      tacticalSnapshot,
      userPlayers,
      opponentPlayers,
      options: currentOptions,
      lastAction: selectedAction,
      lastOutcome: null,
      isPendingSetPiece: false,
    });

    pushTurnMessageSafe(
      MatchMessageType.PLAYER_ACTION,
      'match.turn.selectedAction',
      (locale) => ({
        actionLabel: this.actionLabel(selectedAction, locale, this.i18nService, undefined),
      }),
      {
        minute: 90,
        turn: match.maxTurns,
        teamId: match.teamId,
        teamName: match.teamName,
        playerName: selectedActionPlayer.name,
      },
    );

    const turnOutcome = this.matchActionOutcomeHelper.resolveActionOutcome({
      match,
      context: turnContext,
      currentContext,
      tactical: tacticalSnapshot,
      userPlayers,
      opponentPlayers,
      baseUserPlayers: userPlayers,
      baseOpponentPlayers: opponentPlayers,
      actionsByEvent: this.actionsByEvent,
      isExecutingRegularPenalty: false,
    });
    const outcomeDescriptor = this.matchOutcomeMessageHelper.resolveOutcomeMessage({
      match,
      turnOutcome,
      action: selectedAction,
      minute: 90,
      turn: match.maxTurns,
      mode: MatchOutcomeNarrativeMode.LAST_PLAY,
      lastPlayAttackingTeamId: attackingTeamId,
    });
    pushTurnMessageSafe(
      outcomeDescriptor.type,
      outcomeDescriptor.key,
      outcomeDescriptor.params,
      outcomeDescriptor.metadata,
    );
    const winnerTeamId = turnOutcome.statTeamId;
    const winnerTeamName = turnOutcome.statTeamName;
    const decisivePlayerName = turnOutcome.statPlayerName;
    const decisivePlayerPosition = turnOutcome.statPlayerPosition;

    match.scoreTeam = turnOutcome.scoreTeam;
    match.scoreOpponent = turnOutcome.scoreOpponent;
    match.eventType = MatchEventType.END;
    match.currentZone = turnOutcome.nextZone;
    match.possessionTeam = turnOutcome.nextPossession;
    match.ballCarrierTeamId = turnOutcome.ballCarrierTeamId;
    match.ballCarrierName = turnOutcome.ballCarrierName;
    match.minute = 90;
    match.turn = match.maxTurns;
    match.isFinished = true;
    match.isActive = false;
    match.optionsJson = JSON.stringify([]);

    const finalMessageEn = this.buildFinalMessageLocalized(match, 'en');
    const finalMessageEs = this.buildFinalMessageLocalized(match, 'es');
    turnMessages.en.push(finalMessageEn);
    turnMessages.es.push(finalMessageEs);
    turnMessageItems.push({
      type: MatchMessageType.FINAL,
      en: finalMessageEn,
      es: finalMessageEs,
      minute: 90,
      turn: match.maxTurns,
      teamId: winnerTeamId,
      teamName: winnerTeamName,
      playerName: decisivePlayerName,
    });

    await this.recordMatchStat({
      matchId: match.matchId,
      minute: match.minute,
      turn: match.turn,
      eventType,
      zone: MatchFieldZone.BOX,
      action: selectedAction,
      teamId: winnerTeamId,
      teamName: winnerTeamName,
      playerName: decisivePlayerName,
      playerPosition: decisivePlayerPosition,
      cardType: null,
      isGoal: true,
      message: outcomeDescriptor.timelineMessageEn,
    });

    const { headline: responseHeadline, messageItems: responseMessageItems } =
      this.matchTurnOutputHelper.finalizeTurnOutput({
      bundle: turnMessages,
      localizedItems: turnMessageItems,
      match,
      language,
      fallbackFinalMessage: this.buildFinalMessageLocalized(match, language),
      maxMessagesPerTurn: this.maxMessagesPerTurn,
    });
    match.message = responseHeadline;

    const finalResponseContext = await this.matchTurnFlowHelper.buildResponseContext({
      match,
      tacticalSnapshot,
      userPlayers,
      opponentPlayers,
      options: [],
      lastAction: selectedAction,
      lastOutcome: responseHeadline,
      isPendingSetPiece: false,
    });
    match.lastContextJson = JSON.stringify(finalResponseContext);

    await this.recordMatchTurnContext({
      matchId: match.matchId,
      turn: match.turn,
      minute: match.minute,
      phase: 'END',
      selectedAction,
      actionOutcome: null,
      headline: responseHeadline,
      context: finalResponseContext,
    });

    const savedMatch = await this.matchRepository.save(match);
    if (savedMatch.isFinished) {
      await this.worldCupService.markFinalEnded(savedMatch);
    }
    return await this.toMatchResponse(savedMatch, language, responseMessageItems, finalResponseContext);
  }

  private pickPlayerForAction(players: TeamPlayer[], action: MatchAction, zone: MatchFieldZone): TeamPlayer {
    return this.matchPlayerSelectionHelper.pickPlayerForAction(players, action, zone);
  }

  private isLastPlayForEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
        return true;
      default:
        return false;
    }
  }

  private isLastPlayPenaltyEvent(eventType: MatchEventType): boolean {
    switch (eventType) {
      case MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT:
      case MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT:
        return true;
      default:
        return false;
    }
  }

  private buildFinalMessageLocalized(match: MatchEntity, language: MatchLanguage): string {
    return this.matchFinalMessageHelper.buildFinalMessageLocalized(match, language);
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

  private async recordMatchTurnContext(params: {
    matchId: string;
    turn: number;
    minute: number;
    phase: 'START' | 'TURN' | 'END';
    selectedAction: MatchAction | null;
    actionOutcome: MatchActionOutcome | null;
    headline: string | null;
    context: MatchCurrentContext;
  }): Promise<void> {
    await this.matchPersistenceHelper.recordMatchTurnContext(params);
  }

  private async recordMatchStat(params: {
    matchId: string;
    minute: number;
    turn: number;
    eventType: MatchEventType;
    zone?: MatchFieldZone | null;
    action: MatchAction | null;
    teamId: string | null;
    teamName: string | null;
    playerName: string | null;
    playerPosition: string | null;
    cardType: MatchCardType | null;
    isGoal: boolean;
    message: string;
    messageKey?: string | null;
    messageParams?: TranslationParams | null;
  }): Promise<void> {
    await this.matchPersistenceHelper.recordMatchStat(params);
  }
}
