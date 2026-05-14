export interface SquadPlayerApiItem {
  playerId: string;
  name: string;
  position: string;
  shirtNumber: number;
  age: number;
  skill: number;
  attack: number;
  defense: number;
  energy: number;
  isCaptain?: boolean;
}

export interface DictionaryPositionApiItem {
  code: string;
  label: string;
  description: string;
}

export interface DictionaryEventApiItem {
  code: string;
  label: string;
  description: string;
}

export interface GameDictionaryApiResponse {
  positions: DictionaryPositionApiItem[];
  events?: DictionaryEventApiItem[];
}
