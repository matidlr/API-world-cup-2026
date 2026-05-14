import { MatchAction } from '../model/match-action.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';

export interface EventMatrixEntry {
  userActions: MatchAction[];
  opponentActions: MatchAction[];
  allowedZones: MatchFieldZone[];
}

export interface RestartDescriptor {
  action: MatchAction;
  zone: MatchFieldZone;
  messageKey:
    | 'match.restart.freeKick'
    | 'match.restart.corner'
    | 'match.restart.throwIn'
    | 'match.restart.penaltyFor'
    | 'match.restart.penaltyAgainst';
}
