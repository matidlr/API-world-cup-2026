import { Injectable } from '@nestjs/common';
import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { MatchCurrentContext } from '../interfaces/match-current-context.interface';
import { TacticalSnapshot, TurnAdvanceResult, TurnContext } from '../interfaces/match-service.interfaces';
import {
  MatchTurnFlowBuildResponseContextParams,
  MatchTurnFlowDefineTurnParams,
  MatchTurnFlowDefinedTurn,
  MatchTurnFlowFinalizeResponseStateParams,
  MatchTurnFlowHelperContract,
  MatchTurnFlowResponseState,
} from '../interfaces/match-turn-flow.interface';
import { MatchContextBuilderHelper } from './match-context-builder.helper';
import { MatchTurnOrchestratorHelper } from './match-turn-orchestrator.helper';
import { MatchAction } from '../model/match-action.enum';
import { MatchOption } from '../model/match-option.model';
import { MatchEventType } from '../model/match-event-type.enum';
import { resolveAllowedZonesForEvent } from '../model/match-event-matrix.model';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchTurnInputHelper } from './match-turn-input.helper';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { MatchTurnOptionsHelper } from './match-turn-options.helper';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';
import { MatchOnBallActionEnum } from '../model/match-on-ball-action.enum';

@Injectable()
export class MatchTurnFlowHelper
  extends AbstractMatchBasicHelper
  implements MatchTurnFlowHelperContract
{
  private readonly onBallActions = new Set<MatchAction>(
    Object.values(MatchOnBallActionEnum) as unknown as MatchAction[],
  );
  private readonly actionsByEvent: Record<MatchEventType, MatchAction[]>;

  constructor(
    private readonly matchTurnOrchestratorHelper: MatchTurnOrchestratorHelper,
    private readonly matchContextBuilderHelper: MatchContextBuilderHelper,
    private readonly matchTurnInputHelper: MatchTurnInputHelper,
    private readonly matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
    private readonly matchTurnOptionsHelper: MatchTurnOptionsHelper,
  ) {
    super();
    this.actionsByEvent = this.matchRuntimeConfigHelper.loadActionsByEvent();
  }

  async defineTurn(params: MatchTurnFlowDefineTurnParams): Promise<MatchTurnFlowDefinedTurn> {
    const effectiveTurnInput = this.resolveEffectiveTurnInput(params);
    const turnAdvance = this.matchTurnOrchestratorHelper.buildTurnAdvance({
      match: params.match,
      selectedAction: params.selectedAction,
      rawEventType: effectiveTurnInput.rawEventType,
      possession: effectiveTurnInput.possession,
      zone: effectiveTurnInput.zone,
      userPlayers: params.userPlayers,
      baseUserPlayers: params.baseUserPlayers,
      opponentPlayers: params.opponentPlayers,
      baseOpponentPlayers: params.baseOpponentPlayers,
    });
    const turnContext = turnAdvance.turnContext;
    turnContext.actingPlayer = this.resolveActionActor({
      match: params.match,
      turnContext,
      userPlayers: params.userPlayers,
      opponentPlayers: params.opponentPlayers,
      baseUserPlayers: params.baseUserPlayers,
      baseOpponentPlayers: params.baseOpponentPlayers,
    });

    const availableActions = this.matchContextBuilderHelper.getAvailableActions(
      effectiveTurnInput.rawEventType,
      effectiveTurnInput.zone,
      effectiveTurnInput.possession,
      this.actionsByEvent,
    );
    const currentContext = await this.matchContextBuilderHelper.buildContext({
      match: params.match,
      eventType: effectiveTurnInput.rawEventType,
      zone: effectiveTurnInput.zone,
      possession: effectiveTurnInput.possession,
      actingPlayer: turnContext.actingPlayer,
      availableActions,
      actionsByEvent: this.actionsByEvent,
      tacticalSnapshot: params.tacticalSnapshot,
      userPlayers: params.userPlayers.length ? params.userPlayers : params.baseUserPlayers,
      opponentPlayers: params.opponentPlayers.length ? params.opponentPlayers : params.baseOpponentPlayers,
      isPendingSetPiece:
        this.isRegularPenaltyEvent(effectiveTurnInput.rawEventType) && !params.isExecutingRegularPenalty,
      lastAction: params.selectedAction,
    });

    return {
      rawEventType: effectiveTurnInput.rawEventType,
      possession: effectiveTurnInput.possession,
      zone: effectiveTurnInput.zone,
      turnAdvance,
      turnContext,
      currentContext,
    };
  }

  applyTurnAdvance(
    match: MatchEntity,
    turnAdvance: TurnAdvanceResult,
    rawEventType: MatchEventType,
  ): void {
    this.matchTurnOrchestratorHelper.applyTurnAdvanceToMatch(match, turnAdvance, rawEventType);
  }

  async buildResponseContext(
    params: MatchTurnFlowBuildResponseContextParams,
  ): Promise<MatchCurrentContext> {
    const persistedPossession =
      (params.match.possessionTeam as MatchPossession) || MatchPossession.USER;
    const possession = this.resolvePossessionFromCarrier({
      match: params.match,
      fallbackPossession: persistedPossession,
    });
    params.match.possessionTeam = possession;
    const zone = (params.match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD;
    const eventType =
      (params.match.eventType as MatchEventType) || MatchEventType.BALL_POSSESSION_EVENT;
    const actingPlayer = this.resolveActingPlayerFromMatchState({
      match: params.match,
      possession,
      userPlayers: params.userPlayers,
      opponentPlayers: params.opponentPlayers,
    });

    return await this.matchContextBuilderHelper.buildContext({
      match: params.match,
      eventType,
      zone,
      possession,
      actingPlayer,
      availableActions: params.options.map((option) => option.action),
      actionsByEvent: this.actionsByEvent,
      tacticalSnapshot: params.tacticalSnapshot,
      userPlayers: params.userPlayers,
      opponentPlayers: params.opponentPlayers,
      isPendingSetPiece: params.isPendingSetPiece,
      lastAction: params.lastAction,
      lastOutcome: params.lastOutcome,
    });
  }

  async finalizeResponseState(
    params: MatchTurnFlowFinalizeResponseStateParams,
  ): Promise<MatchTurnFlowResponseState> {
    let options: MatchOption[] = [];
    if (!params.match.isFinished) {
      options = this.matchTurnOptionsHelper.buildOptions({
        eventType:
          (params.match.eventType as MatchEventType) || MatchEventType.BALL_POSSESSION_EVENT,
        language: params.language,
        possession: (params.match.possessionTeam as MatchPossession) || MatchPossession.USER,
        zone: (params.match.currentZone as MatchFieldZone) || MatchFieldZone.MIDFIELD,
        actionsByEvent: this.actionsByEvent,
      });
    }

    params.match.optionsJson = JSON.stringify(options);
    const context = await this.buildResponseContext({
      match: params.match,
      tacticalSnapshot: params.tacticalSnapshot,
      userPlayers: params.userPlayers,
      opponentPlayers: params.opponentPlayers,
      options,
      lastAction: params.lastAction,
      lastOutcome: params.lastOutcome,
      isPendingSetPiece: params.isPendingSetPiece,
    });

    return { options, context };
  }

  private resolveEffectiveTurnInput(
    params: MatchTurnFlowDefineTurnParams,
  ): {
    rawEventType: MatchEventType;
    possession: MatchPossession;
    zone: MatchFieldZone;
  } {
    if (params.isExecutingRegularPenalty) {
      return {
        rawEventType: params.currentEventType,
        possession: this.matchTurnInputHelper.resolvePenaltyAwardedSide(params.currentEventType),
        zone: MatchFieldZone.BOX,
      };
    }

    const rawEventType = this.normalizeEventType(
      params.currentEventType || (params.match.eventType as MatchEventType),
    );
    const persistedPossession = this.resolvePersistedPossession(params.match.possessionTeam as MatchPossession);
    const possession = this.matchTurnOrchestratorHelper.normalizePossessionForEvent(
      rawEventType,
      persistedPossession,
    );
    const zone = this.resolvePersistedZone(rawEventType, params.match.currentZone as MatchFieldZone);

    return { rawEventType, possession, zone };
  }

  private normalizeEventType(value: MatchEventType | null | undefined): MatchEventType {
    if (value && Object.values(MatchEventType).includes(value)) {
      return value;
    }

    return MatchEventType.BALL_POSSESSION_EVENT;
  }

  private resolvePersistedPossession(value: MatchPossession | null | undefined): MatchPossession {
    if (value === MatchPossession.USER || value === MatchPossession.OPPONENT) {
      return value;
    }

    return MatchPossession.USER;
  }

  private resolvePersistedZone(
    eventType: MatchEventType,
    zone: MatchFieldZone | null | undefined,
  ): MatchFieldZone {
    const allowedZones = resolveAllowedZonesForEvent(eventType);

    if (zone && allowedZones.includes(zone)) {
      return zone;
    }

    return allowedZones[0] || MatchFieldZone.MIDFIELD;
  }

  private resolveActingPlayerFromMatchState(params: {
    match: MatchTurnFlowBuildResponseContextParams['match'];
    possession: MatchPossession;
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
  }): TeamPlayer {
    const { match, possession, userPlayers, opponentPlayers } = params;
    const carrierSide = this.resolveCarrierSide(match.ballCarrierTeamId, match);
    const actingPlayers = possession === MatchPossession.USER ? userPlayers : opponentPlayers;
    const carrierPlayers =
      carrierSide === MatchPossession.USER
        ? userPlayers
        : carrierSide === MatchPossession.OPPONENT
          ? opponentPlayers
          : actingPlayers;
    const oppositePlayers =
      carrierSide === MatchPossession.USER
        ? opponentPlayers
        : carrierSide === MatchPossession.OPPONENT
          ? userPlayers
          : [];
    const fallbackPlayers = carrierPlayers.length ? carrierPlayers : actingPlayers;

    const normalizedCarrierName = this.normalizePlayerName(match.ballCarrierName);
    if (normalizedCarrierName && fallbackPlayers.length) {
      const found = fallbackPlayers.find(
        (player) => this.normalizePlayerName(player.name) === normalizedCarrierName,
      );
      if (found) {
        return found;
      }
    }

    if (normalizedCarrierName) {
      const existsOnOppositeSide = oppositePlayers.some(
        (player) => this.normalizePlayerName(player.name) === normalizedCarrierName,
      );
      if (existsOnOppositeSide && fallbackPlayers.length) {
        // If carrier name exists only on the opposite side, treat it as stale cross-side name
        // and keep coherence by selecting a player from the side that currently owns possession.
        return fallbackPlayers[0];
      }

      // Keep context coherent: if carrier name is not found in roster, preserve
      // carrier identity instead of swapping to another player from the same side.
      return this.buildFallbackCarrierPlayer(match.ballCarrierName || 'Unknown Player');
    }

    if (actingPlayers.length) {
      return actingPlayers[0];
    }

    if (carrierPlayers.length) {
      return carrierPlayers[0];
    }

    return {
      playerId: 'fallback-player',
      name: match.ballCarrierName || 'Unknown Player',
      position: 'MF',
      shirtNumber: 0,
      age: 27,
      skill: 50,
      attack: 50,
      defense: 50,
      energy: 100,
      isCaptain: false,
    };
  }

  private resolveActionActor(params: {
    match: MatchEntity;
    turnContext: TurnContext;
    userPlayers: TeamPlayer[];
    opponentPlayers: TeamPlayer[];
    baseUserPlayers: TeamPlayer[];
    baseOpponentPlayers: TeamPlayer[];
  }): TeamPlayer {
    const { match, turnContext, userPlayers, opponentPlayers, baseUserPlayers, baseOpponentPlayers } = params;
    const normalizedCarrierName = this.normalizePlayerName(match.ballCarrierName);
    const sourcePlayers =
      turnContext.actingTeamId === match.teamId
        ? (userPlayers.length ? userPlayers : baseUserPlayers)
        : (opponentPlayers.length ? opponentPlayers : baseOpponentPlayers);

    if (!normalizedCarrierName) {
      return turnContext.actingPlayer;
    }

    if (
      match.ballCarrierTeamId === turnContext.actingTeamId ||
      this.onBallActions.has(turnContext.action)
    ) {
      const carrier = sourcePlayers.find(
        (player) => this.normalizePlayerName(player.name) === normalizedCarrierName,
      );
      if (carrier) {
        return carrier;
      }

      if (this.onBallActions.has(turnContext.action)) {
        return this.buildFallbackCarrierPlayer(match.ballCarrierName || turnContext.actingPlayer.name);
      }
    }

    return turnContext.actingPlayer;
  }

  private resolvePossessionFromCarrier(params: {
    match: MatchEntity;
    fallbackPossession: MatchPossession;
  }): MatchPossession {
    const { match, fallbackPossession } = params;
    switch (match.ballCarrierTeamId) {
      case match.teamId:
        return MatchPossession.USER;
      case match.opponentId:
        return MatchPossession.OPPONENT;
      default:
        return fallbackPossession;
    }
  }

  private resolveCarrierSide(
    ballCarrierTeamId: string | null | undefined,
    match: MatchEntity,
  ): MatchPossession | null {
    switch (ballCarrierTeamId) {
      case match.teamId:
        return MatchPossession.USER;
      case match.opponentId:
        return MatchPossession.OPPONENT;
      default:
        return null;
    }
  }

  private buildFallbackCarrierPlayer(name: string): TeamPlayer {
    return {
      playerId: `fallback-${name.trim().toLowerCase().replace(/\s+/g, '-') || 'player'}`,
      name,
      position: 'MF',
      shirtNumber: 0,
      age: 27,
      skill: 50,
      attack: 50,
      defense: 50,
      energy: 100,
      isCaptain: false,
    };
  }

  private normalizePlayerName(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return value.trim().toLowerCase();
  }

  private isRegularPenaltyEvent(eventType: MatchEventType): boolean {
    return (
      eventType === MatchEventType.PENALTY_FOR_EVENT ||
      eventType === MatchEventType.PENALTY_AGAINST_EVENT
    );
  }
}
