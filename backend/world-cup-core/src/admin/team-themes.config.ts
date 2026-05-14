export interface TeamTheme {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  textLight: string;
  textDark: string;
}

export const GENERIC_THEME: TeamTheme = {
  primary: '#455A64',
  secondary: '#607D8B',
  accent: '#90A4AE',
  dark: '#263238',
  textLight: '#FFFFFF',
  textDark: '#212121',
};

export const TEAM_THEMES: Record<string, TeamTheme> = {
  arg: {
    primary: '#74ACDF',
    secondary: '#FFFFFF',
    accent: '#4A90C4',
    dark: '#2E6DA8',
    textLight: '#FFFFFF',
    textDark: '#1A1A2E',
  },
  bra: {
    primary: '#009C3B',
    secondary: '#FFDF00',
    accent: '#002776',
    dark: '#005C20',
    textLight: '#FFDF00',
    textDark: '#002776',
  },
  ger: {
    primary: '#000000',
    secondary: '#DD0000',
    accent: '#FFCE00',
    dark: '#1A1A1A',
    textLight: '#FFFFFF',
    textDark: '#000000',
  },
  fra: {
    primary: '#002395',
    secondary: '#FFFFFF',
    accent: '#ED2939',
    dark: '#001A6E',
    textLight: '#FFFFFF',
    textDark: '#002395',
  },
  uru: {
    primary: '#5AAAD7',
    secondary: '#FFFFFF',
    accent: '#FFCF00',
    dark: '#2A6A96',
    textLight: '#FFFFFF',
    textDark: '#1A1A2E',
  },
  esp: {
    primary: '#AA151B',
    secondary: '#F1BF00',
    accent: '#AA151B',
    dark: '#7A0E12',
    textLight: '#FFFFFF',
    textDark: '#7A0E12',
  },
  eng: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    accent: '#CF142B',
    dark: '#1B2F6B',
    textLight: '#FFFFFF',
    textDark: '#102040',
  },
};

export function getTeamTheme(teamId: string): TeamTheme {
  return TEAM_THEMES[teamId?.toLowerCase()] ?? GENERIC_THEME;
}
