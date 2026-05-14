export interface SquadPlayer {
  playerId: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW' | string;
  shirtNumber: number;
  age: number;
  skill: number;
  attack: number;
  defense: number;
  energy: number;
  isCaptain: boolean;
}
