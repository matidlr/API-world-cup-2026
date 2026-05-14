import { Injectable } from '@nestjs/common';
import { MatchActionOutcomeIncidentType } from '../model/match-action-outcome-incident-type.enum';
import { MatchAction } from '../model/match-action.enum';
import { MatchEventType } from '../model/match-event-type.enum';
import { MatchFieldZone } from '../model/match-field-zone.enum';
import { MatchPossession } from '../model/match-possession.enum';
import {
  MatchPenaltyResolutionHelperContract,
  ResolvePenaltyAwardIncidentParams,
  MatchPenaltyAwardResolution,
  MatchPenaltySaveResolution,
} from '../interfaces/match-penalty-resolution.helper.interface';
import { MatchPlayerSelectionHelper } from './match-player-selection.helper';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

@Injectable()
export class MatchPenaltyResolutionHelper
  extends AbstractMatchBasicHelper
  implements MatchPenaltyResolutionHelperContract
{
  constructor(private readonly matchPlayerSelectionHelper: MatchPlayerSelectionHelper) {
    super();
  }

  resolvePenaltyAwardIncident(params: ResolvePenaltyAwardIncidentParams): MatchPenaltyAwardResolution {
    const awardedSide =
      params.eventType === MatchEventType.PENALTY_FOR_EVENT
        ? MatchPossession.USER
        : MatchPossession.OPPONENT;
    const awardedTeamId = awardedSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId;
    const awardedTeamName =
      awardedSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName;
    const designatedPenaltyTaker = this.resolvePenaltyTaker(params, awardedSide);

    return {
      awardedSide,
      awardedTeamId,
      awardedTeamName,
      designatedPenaltyTaker,
      incident: {
        type: MatchActionOutcomeIncidentType.PENALTY_AWARDED,
        eventType: params.eventType,
        zone: MatchFieldZone.BOX,
        possession: awardedSide,
        teamId: awardedTeamId,
        teamName: awardedTeamName,
        playerName: designatedPenaltyTaker.name,
        action: MatchAction.SHOOT,
        messageKey: 'match.penalty.foulWhistle',
        messageParams: {
          teamName: awardedTeamName,
        },
      },
    };
  }

  resolvePenaltySaveIncident(params: ResolvePenaltyAwardIncidentParams): MatchPenaltySaveResolution {
    const defendingSide =
      params.eventType === MatchEventType.PENALTY_FOR_EVENT
        ? MatchPossession.OPPONENT
        : MatchPossession.USER;
    const defendingTeamId =
      defendingSide === MatchPossession.USER ? params.match.teamId : params.match.opponentId;
    const defendingTeamName =
      defendingSide === MatchPossession.USER ? params.match.teamName : params.match.opponentName;
    const defendingPlayers = this.resolveSidePlayers(params, defendingSide);
    const goalkeeper =
      defendingPlayers.find((player) => player.position === 'GK') ||
      this.matchPlayerSelectionHelper.pickPlayerForAction(
        defendingPlayers,
        MatchAction.DIVE_LEFT,
        MatchFieldZone.BOX,
      );

    return {
      defendingSide,
      defendingTeamId,
      defendingTeamName,
      goalkeeper,
      incident: {
        type: MatchActionOutcomeIncidentType.PENALTY_SAVE,
        eventType: params.eventType,
        zone: MatchFieldZone.BOX,
        possession: defendingSide,
        teamId: defendingTeamId,
        teamName: defendingTeamName,
        playerName: goalkeeper.name,
        action: MatchAction.DIVE_LEFT,
        messageKey: 'match.turn.penaltySaved',
        messageParams: {
          goalkeeperName: goalkeeper.name,
          teamName: defendingTeamName,
        },
      },
    };
  }

  private resolvePenaltyTaker(
    params: ResolvePenaltyAwardIncidentParams,
    awardedSide: MatchPossession,
  ) {
    const awardedPlayers = this.resolveSidePlayers(params, awardedSide);
    return this.matchPlayerSelectionHelper.pickPlayerForAction(
      awardedPlayers,
      MatchAction.SHOOT,
      MatchFieldZone.BOX,
    );
  }

  private resolveSidePlayers(params: ResolvePenaltyAwardIncidentParams, side: MatchPossession) {
    if (side === MatchPossession.USER) {
      return params.userPlayers.length ? params.userPlayers : params.baseUserPlayers;
    }

    return params.opponentPlayers.length ? params.opponentPlayers : params.baseOpponentPlayers;
  }
}
