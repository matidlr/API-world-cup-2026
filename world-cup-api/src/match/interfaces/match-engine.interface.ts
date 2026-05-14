import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchEntity } from '../entity/match.entity';
import { TacticalSnapshot } from './match-service.interfaces';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchOption } from '../model/match-option.model';
import { MatchResponse } from '../model/match-response.model';
import { MatchStrategy } from '../model/match-strategy.enum';
import { StartFinalRequest } from '../request/start-final.request';
import { PlayRequest } from '../request/play.request';
import { MatchFormation } from '../model/match-formation.enum';

export interface UserTacticalShift {
  previousStrategy: MatchStrategy;
  previousFormation: MatchFormation;
  strategy: MatchStrategy;
  formation: MatchFormation;
}

export interface MatchEnginePreparePlayResult {
  language: MatchLanguage;
  match: MatchEntity;
  currentStrategy: MatchStrategy | null;
  currentFormation: MatchFormation | null;
  opponentStrategy: MatchStrategy | null;
  opponentFormation: MatchFormation | null;
  selectedOption: MatchOption;
  baseUserPlayers: TeamPlayer[];
  baseOpponentPlayers: TeamPlayer[];
  userPlayers: TeamPlayer[];
  opponentPlayers: TeamPlayer[];
  tacticalSnapshot: TacticalSnapshot;
  currentEventType: MatchEventType;
  isExecutingRegularPenalty: boolean;
  userTacticalShift: UserTacticalShift | null;
}

export interface MatchEngineContract {
  startFinal(request: StartFinalRequest): Promise<MatchResponse>;
  play(request: PlayRequest): Promise<MatchResponse>;
  preparePlay(request: PlayRequest): Promise<MatchEnginePreparePlayResult>;
}
