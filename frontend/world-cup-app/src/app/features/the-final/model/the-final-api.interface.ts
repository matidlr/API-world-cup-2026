export interface PlayFinalOptionApiItem {
  index: number;
  label: string;
  action: string;
}

export interface PlayFinalMessageApiItem {
  type: string;
  text: string;
  minute: number;
  minuteLabel: string;
  turn: number;
  teamId: string | null;
  teamName: string | null;
  playerName: string | null;
  icon: string;
}

export interface PlayFinalApiResponse {
  matchId: string;
  teamId: string;
  opponentId: string;
  teamName: string;
  opponentName: string;
  score: string;
  minute: number;
  turn: number;
  zone: string | null;
  possession: string | null;
  ballCarrier: string | null;
  teamStrategy: string | null;
  teamFormation: string | null;
  opponentStrategy: string | null;
  opponentFormation: string | null;
  isFinished: boolean;
  result: string | null;
  options: PlayFinalOptionApiItem[];
  messages: PlayFinalMessageApiItem[];
}