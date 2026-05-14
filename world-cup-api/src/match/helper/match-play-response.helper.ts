import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamsService } from 'src/teams/teams.service';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import { I18nService } from 'src/i18n/i18n.service';
import { WorldCupService } from 'src/world-cup/world-cup.service';
import { MatchPlayResponseHelperContract } from '../interfaces/match-play-response.interface';
import { MatchResponse } from '../model/match-response.model';
import { MatchPlayStageContext } from '../interfaces/match-play-stage.interface';
import { MatchTurnFlowHelper } from './match-turn-flow.helper';
import { MatchPersistenceHelper } from './match-persistence.helper';
import { MatchResponseMapperHelper } from './match-response-mapper.helper';
import { MatchFinalMessageHelper } from './match-final-message.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { MatchEntity } from '../entity/match.entity';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchLanguage } from '../model/match-language.model';
import { DEFAULT_MATCH_LANGUAGE } from '../model/match-engine.constants';
import { MatchTurnOutputHelper } from './match-turn-output.helper';

@Injectable()
export class MatchPlayResponseHelper implements MatchPlayResponseHelperContract {
  private readonly maxMessagesPerTurn: number;

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    private readonly teamsService: TeamsService,
    private readonly i18nService: I18nService,
    private readonly worldCupService: WorldCupService,
    private readonly matchTurnFlowHelper: MatchTurnFlowHelper,
    private readonly matchPersistenceHelper: MatchPersistenceHelper,
    private readonly matchResponseMapperHelper: MatchResponseMapperHelper,
    private readonly matchFinalMessageHelper: MatchFinalMessageHelper,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchTurnOutputHelper: MatchTurnOutputHelper,
  ) {
    this.maxMessagesPerTurn = this.matchRuntimeConfigHelper.loadMaxMessagesPerTurn();
  }

  async build(context: MatchPlayStageContext): Promise<MatchResponse> {
    const payload = context.responsePayload;
    if (!payload) {
      throw new Error('MatchPlayResponseHelper expected response payload from previous stage.');
    }

    const responseState = await this.matchTurnFlowHelper.finalizeResponseState({
      match: payload.match,
      language: DEFAULT_MATCH_LANGUAGE,
      tacticalSnapshot: payload.tacticalSnapshot,
      userPlayers: payload.userPlayers,
      opponentPlayers: payload.opponentPlayers,
      lastAction: payload.selectedAction,
      isPendingSetPiece:
        payload.match.eventType === MatchEventType.PENALTY_FOR_EVENT ||
        payload.match.eventType === MatchEventType.PENALTY_AGAINST_EVENT,
    });

    this.decayMoraleEffects(payload.match);

    const { headline: responseHeadline, messageItems: responseMessageItems } =
      this.matchTurnOutputHelper.finalizeTurnOutput({
        bundle: payload.turnMessages,
        localizedItems: payload.turnMessageItems,
        match: payload.match,
        language: payload.language,
        fallbackFinalMessage: this.buildFinalMessageLocalized(payload.match, payload.language),
        maxMessagesPerTurn: this.maxMessagesPerTurn,
      });

    payload.match.message = responseHeadline;
    responseState.context.lastOutcome = responseHeadline;
    const responseContext = responseState.context;
    payload.match.lastContextJson = JSON.stringify(responseContext);

    await this.matchPersistenceHelper.recordMatchTurnContext({
      matchId: payload.match.matchId,
      turn: payload.match.turn,
      minute: payload.match.minute,
      phase: 'TURN',
      selectedAction: payload.selectedAction,
      actionOutcome: payload.actionOutcome,
      headline: responseHeadline,
      context: responseContext,
    });

    const savedMatch = await this.matchRepository.save(payload.match);
    if (savedMatch.isFinished) {
      await this.worldCupService.markFinalEnded(savedMatch);
    }

    const coachMetadata = await this.resolveCoachMetadata(savedMatch);
    return this.matchResponseMapperHelper.buildMatchResponse({
      match: savedMatch,
      language: payload.language,
      coachMetadata,
      optionsJson: savedMatch.optionsJson,
      messageItems: responseMessageItems,
      currentContext: responseContext,
    });
  }

  private buildFinalMessageLocalized(match: MatchEntity, language: MatchLanguage): string {
    return this.matchFinalMessageHelper.buildFinalMessageLocalized(match, language);
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

  private decayMoraleEffects(match: MatchEntity): void {
    match.teamMoraleBoostTurns = Math.max(0, match.teamMoraleBoostTurns - 1);
    match.teamMoralePenaltyTurns = Math.max(0, match.teamMoralePenaltyTurns - 1);
    match.opponentMoraleBoostTurns = Math.max(0, match.opponentMoraleBoostTurns - 1);
    match.opponentMoralePenaltyTurns = Math.max(0, match.opponentMoralePenaltyTurns - 1);
  }
}
