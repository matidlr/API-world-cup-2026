export class PlayFinalModel {

  public matchId: string;
  public teamId: string;
  public opponentId: string;
  public teamName: string;
  public opponentName: string;

  public messageItems: MessageItemsModel[];

  public score: string;
  public minute: number;
  public turn: number;

  public zone: string;
  public possession: string;
  public ballCarrier: string;

  public teamStrategy: string;
  public teamFormation: string;
  public teamCoachName: string;
  public teamCoachProfile: string;

  public opponentStrategy: string;
  public opponentFormation: string;
  public opponentCoachName: string;
  public opponentCoachProfile: string;

  public eventType: string;

  public options: OptionsModel[];

  public isFinished: boolean;
  public result: string;

  public currentContext: {};

  constructor(data: {
    matchId: string;
    teamId: string;
    opponentId: string;
    teamName: string;
    opponentName: string;

    messageItems: MessageItemsModel[];

    score: string;
    minute: number;
    turn: number;

    zone: string;
    possession: string;
    ballCarrier: string;

    teamStrategy: string;
    teamFormation: string;
    teamCoachName: string;
    teamCoachProfile: string;

    opponentStrategy: string;
    opponentFormation: string;
    opponentCoachName: string;
    opponentCoachProfile: string;

    eventType: string;

    options: OptionsModel[];

    isFinished: boolean;
    result: string;

    currentContext: {};
  }) {

    this.matchId = data.matchId;
    this.teamId = data.teamId;
    this.opponentId = data.opponentId;
    this.teamName = data.teamName;
    this.opponentName = data.opponentName;

    this.messageItems = data.messageItems;

    this.score = data.score;
    this.minute = data.minute;
    this.turn = data.turn;

    this.zone = data.zone;
    this.possession = data.possession;
    this.ballCarrier = data.ballCarrier;

    this.teamStrategy = data.teamStrategy;
    this.teamFormation = data.teamFormation;
    this.teamCoachName = data.teamCoachName;
    this.teamCoachProfile = data.teamCoachProfile;

    this.opponentStrategy = data.opponentStrategy;
    this.opponentFormation = data.opponentFormation;
    this.opponentCoachName = data.opponentCoachName;
    this.opponentCoachProfile = data.opponentCoachProfile;

    this.eventType = data.eventType;

    this.options = data.options;

    this.isFinished = data.isFinished;
    this.result = data.result;

    this.currentContext = data.currentContext;
  }
}

export class MessageItemsModel {
  public messageKey: string;
  public type: string;
  public text: string;
  public minute: number;
  public turn: number;
  public teamId: string;
  public teamName: string;
  public playerName: string;

  constructor(data: {
    messageKey: string;
    type: string;
    text: string;
    minute: number;
    turn: number;
    teamId: string;
    teamName: string;
    playerName: string;
  }) {
    this.messageKey = data.messageKey;
    this.type = data.type;
    this.text = data.text;
    this.minute = data.minute;
    this.turn = data.turn;
    this.teamId = data.teamId;
    this.teamName = data.teamName;
    this.playerName = data.playerName;
  }
}

export class OptionsModel {
  public index: number;
  public label: string;
  public action: string;

  constructor(data: {
    index: number;
    label: string;
    action: string;
  }) {
    this.index = data.index;
    this.label = data.label;
    this.action = data.action;
  }
}

export class CurrentWorldCupApiResponse {
  public worldCupId: string;
  public edition: number;
  public status: string;
  public hasActiveFinal: boolean;
  public canResimulate: boolean;
  public canStartFinal: boolean;
  public selectedTeamId: string;
  public selectedTeamName: string;
  public finalHomeTeamId: string | null;
  public finalHomeTeamName: string | null;
  public finalAwayTeamId: string | null;
  public finalAwayTeamName: string | null;
  public finalMatchId: string | null;
  public createdAt: string;
  public updatedAt: string;

  constructor(data: {
    worldCupId: string;
    edition: number;
    status: string;
    hasActiveFinal: boolean;
    canResimulate: boolean;
    canStartFinal: boolean;
    selectedTeamId: string;
    selectedTeamName: string;
    finalHomeTeamId: string | null;
    finalHomeTeamName: string | null;
    finalAwayTeamId: string | null;
    finalAwayTeamName: string | null;
    finalMatchId: string | null;
    createdAt: string;
    updatedAt: string;
  }) {
    this.worldCupId =        data.worldCupId;
    this.edition =           data.edition;
    this.status =            data.status;
    this.hasActiveFinal =    data.hasActiveFinal;
    this.canResimulate =     data.canResimulate;
    this.canStartFinal =     data.canStartFinal;
    this.selectedTeamId =    data.selectedTeamId;
    this.selectedTeamName =  data.selectedTeamName;
    this.finalHomeTeamId =   data.finalHomeTeamId;
    this.finalHomeTeamName = data.finalHomeTeamName;
    this.finalAwayTeamId =   data.finalAwayTeamId;
    this.finalAwayTeamName = data.finalAwayTeamName;
    this.finalMatchId =      data.finalMatchId;
    this.createdAt =         data.createdAt;
    this.updatedAt =         data.updatedAt;
  }
}

export interface WorldCupStatusResponse {
  canStartFinal:     boolean;
  hasActiveFinal:    boolean;
  status:            string;
  finalHomeTeamName: string | null;
  finalAwayTeamName: string | null;
}

interface StrategyLineImpact {
  attack:   number;
  defense:  number;
  midfield: number;
}

export interface StrategyRawItem {
  strategy:             string;
  description:          string;
  compatibleFormations: string[];
  strategyLineImpact:   StrategyLineImpact;
}

export interface FormationsRawItem {
    formation: string;
    description: string;
    compatibleStrategies: string[];
}

export interface SelectStrategyResponse {
  teamId: string,
  strategy: string,
  formation: string,
  formationAutoAdjusted: boolean,
  message: string
}

export interface SelectFormationResponse{
     teamId: string;
     formation: string;
     message: string;
}