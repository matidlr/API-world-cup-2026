import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { MatchCurrentContext } from './match-current-context.interface';
import { TacticalSnapshot, TurnAdvanceResult, TurnContext } from './match-service.interfaces';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchOption } from '../model/match-option.model';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchStrategy } from '../model/match-strategy.enum';

export interface MatchTurnFlowDefineTurnParams {
  match: MatchEntity;
  selectedAction: MatchAction;
  currentStrategy: MatchStrategy | null;
  currentEventType: MatchEventType;
  isExecutingRegularPenalty: boolean;
  tacticalSnapshot: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  baseUserPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
}

export interface MatchTurnFlowDefinedTurn {
  rawEventType: MatchEventType;
  possession: MatchPossession;
  zone: MatchFieldZone;
  turnAdvance: TurnAdvanceResult;
  turnContext: TurnContext;
  currentContext: MatchCurrentContext;
}

export interface MatchTurnFlowBuildResponseContextParams {
  match: MatchEntity;
  tacticalSnapshot: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  options: MatchOption[];
  lastAction?: MatchAction;
  lastOutcome?: string;
  isPendingSetPiece: boolean;
}

export interface MatchTurnFlowFinalizeResponseStateParams {
  match: MatchEntity;
  language: MatchLanguage;
  tacticalSnapshot: TacticalSnapshot;
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  lastAction?: MatchAction;
  lastOutcome?: string;
  isPendingSetPiece: boolean;
}

export interface MatchTurnFlowResponseState {
  options: MatchOption[];
  context: MatchCurrentContext;
}

export interface MatchTurnFlowHelperContract {
  defineTurn(params: MatchTurnFlowDefineTurnParams): Promise<MatchTurnFlowDefinedTurn>;
  applyTurnAdvance(match: MatchEntity, turnAdvance: TurnAdvanceResult, rawEventType: MatchEventType): void;
  buildResponseContext(params: MatchTurnFlowBuildResponseContextParams): Promise<MatchCurrentContext>;
  finalizeResponseState(params: MatchTurnFlowFinalizeResponseStateParams): Promise<MatchTurnFlowResponseState>;
}
