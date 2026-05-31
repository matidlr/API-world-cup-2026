// play-final-api.interface.ts

export interface TheFinalOptionApiItem {
  index:  number;
  label:  string;
  action: string;
}

export interface TheFinalMessageApiItem {
  type:        string;
  text:        string;
  minute:      number;
  minuteLabel: string;
  turn:        number;
  teamId:      string | null;
  teamName:    string | null;
  playerName:  string | null;
  icon:        string;
}

export interface TheFinalApiResponse {
  // identidad
  matchId:     string;
  teamId:      string;
  opponentId:  string;
  teamName:    string;
  opponentName: string;

  // marcador
  score:   string;
  minute:  number;
  turn:    number;

  // posesión y zona
  zone:        string | null;
  possession:  string | null;
  ballCarrier: string | null;

  // táctica del equipo
  teamStrategy:     string | null;
  teamFormation:    string | null;
  teamCoachName:    string | null;
  teamCoachProfile: string | null;

  // táctica del rival
  opponentStrategy:     string | null;
  opponentFormation:    string | null;
  opponentCoachName:    string | null;
  opponentCoachProfile: string | null;

  // estado del partido
  isFinished: boolean;
  result:     string | null;

  // chat
  options:  TheFinalOptionApiItem[];
  messages: TheFinalMessageApiItem[];
}