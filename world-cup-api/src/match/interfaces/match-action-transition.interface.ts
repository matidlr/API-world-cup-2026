import { TeamPlayer } from 'src/teams/model/team-player.model';
import { MatchAction } from '../model/match-action.enum';
import { MatchActionOutcome } from '../model/match-action-outcome.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import { MatchCurrentContext } from './match-current-context.interface';

export interface ResolveMatchActionTransitionParams {
  context: MatchCurrentContext;
  action: MatchAction;
  actionOutcome: MatchActionOutcome;
}

export interface MatchActionTransitionResult {
  nextZone: MatchFieldZone;
  nextPossession: MatchPossession;
  nextEventType: MatchEventType;
  nextActingPlayer: TeamPlayer;
}

export interface MatchActionTransitionHelperContract {
  resolveTransition(
    params: ResolveMatchActionTransitionParams,
  ): MatchActionTransitionResult;
}
