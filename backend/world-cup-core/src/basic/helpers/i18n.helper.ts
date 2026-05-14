import { LanguageEnum } from '../model/language.enum';

const STAGE_LABELS: Record<string, Record<LanguageEnum, string>> = {
  GROUP_STAGE: { [LanguageEnum.EN]: 'Group Stage', [LanguageEnum.ES]: 'Fase de Grupos' },
  ROUND_OF_32: { [LanguageEnum.EN]: 'Round of 32', [LanguageEnum.ES]: 'Dieciseisavos' },
  ROUND_OF_16: { [LanguageEnum.EN]: 'Round of 16', [LanguageEnum.ES]: 'Octavos' },
  QUARTER_FINALS: { [LanguageEnum.EN]: 'Quarter Finals', [LanguageEnum.ES]: 'Cuartos de Final' },
  SEMI_FINALS: { [LanguageEnum.EN]: 'Semi Finals', [LanguageEnum.ES]: 'Semifinales' },
  THIRD_PLACE: { [LanguageEnum.EN]: 'Third Place', [LanguageEnum.ES]: 'Tercer Puesto' },
  FINAL: { [LanguageEnum.EN]: 'Final', [LanguageEnum.ES]: 'Final' },
  CHAMPION: { [LanguageEnum.EN]: 'Champion', [LanguageEnum.ES]: 'Campeon' },
};

const RESULT_LABELS: Record<string, Record<LanguageEnum, string>> = {
  WIN: { [LanguageEnum.EN]: 'WIN', [LanguageEnum.ES]: 'GANO' },
  LOSS: { [LanguageEnum.EN]: 'LOSS', [LanguageEnum.ES]: 'PERDIO' },
  DRAW: { [LanguageEnum.EN]: 'DRAW', [LanguageEnum.ES]: 'EMPATE' },
  PENDING: { [LanguageEnum.EN]: 'PENDING', [LanguageEnum.ES]: 'PENDIENTE' },
};

const RESOLUTION_LABELS: Record<string, Record<LanguageEnum, string>> = {
  REGULAR_TIME: { [LanguageEnum.EN]: 'Regular Time', [LanguageEnum.ES]: 'Tiempo Regular' },
  EXTRA_TIME: { [LanguageEnum.EN]: 'Extra Time', [LanguageEnum.ES]: 'Tiempo Extra' },
  PENALTIES: { [LanguageEnum.EN]: 'Penalties', [LanguageEnum.ES]: 'Penales' },
  PENDING: { [LanguageEnum.EN]: 'Pending', [LanguageEnum.ES]: 'Pendiente' },
};

const ZONE_LABELS: Record<string, Record<LanguageEnum, string>> = {
  DEFENSE_THIRD: { [LanguageEnum.EN]: 'Defense Third', [LanguageEnum.ES]: 'Tercio Defensivo' },
  MIDFIELD: { [LanguageEnum.EN]: 'Midfield', [LanguageEnum.ES]: 'Mediocampo' },
  ATTACK_THIRD: { [LanguageEnum.EN]: 'Attack Third', [LanguageEnum.ES]: 'Tercio Ofensivo' },
  BOX: { [LanguageEnum.EN]: 'Box', [LanguageEnum.ES]: 'Area' },
};

const AWARD_LABELS: Record<string, Record<LanguageEnum, string>> = {
  GOLDEN_BOOT: { [LanguageEnum.EN]: 'Golden Boot', [LanguageEnum.ES]: 'Bota de Oro' },
  GOLDEN_GLOVE: { [LanguageEnum.EN]: 'Golden Glove', [LanguageEnum.ES]: 'Guante de Oro' },
  PLAYER_OF_THE_TOURNAMENT: {
    [LanguageEnum.EN]: 'Player of the Tournament',
    [LanguageEnum.ES]: 'Jugador del Torneo',
  },
  PLAYER_OF_TOURNAMENT: {
    [LanguageEnum.EN]: 'Player of the Tournament',
    [LanguageEnum.ES]: 'Jugador del Torneo',
  },
  BEST_YOUNG_PLAYER: {
    [LanguageEnum.EN]: 'Best Young Player',
    [LanguageEnum.ES]: 'Mejor Jugador Joven',
  },
  TOP_ASSISTS: { [LanguageEnum.EN]: 'Top Assists', [LanguageEnum.ES]: 'Maximo Asistente' },
  FAIR_PLAY: { [LanguageEnum.EN]: 'Fair Play', [LanguageEnum.ES]: 'Juego Limpio' },
};

const PODIUM_LABELS: Record<string, Record<LanguageEnum, string>> = {
  CHAMPION: { [LanguageEnum.EN]: 'Champion', [LanguageEnum.ES]: 'Campeon' },
  RUNNER_UP: { [LanguageEnum.EN]: 'Runner-up', [LanguageEnum.ES]: 'Subcampeon' },
  THIRD_PLACE: { [LanguageEnum.EN]: '3rd Place', [LanguageEnum.ES]: '3.er Puesto' },
  FOURTH_PLACE: { [LanguageEnum.EN]: '4th Place', [LanguageEnum.ES]: '4.o Puesto' },
};

const ACTION_LABELS: Record<string, Record<LanguageEnum, string[]>> = {
  RESTART_MATCH: {
    [LanguageEnum.ES]: ['reanudar partido', 'reiniciar partido', 'reanudar', 'reiniciar'],
    [LanguageEnum.EN]: ['restart match', 'restart'],
  },
  ATTACK: { [LanguageEnum.ES]: ['atacar', 'ataque'], [LanguageEnum.EN]: ['attack'] },
  HOLD: {
    [LanguageEnum.ES]: ['mantener posesion', 'mantener la posesion', 'mantener'],
    [LanguageEnum.EN]: ['hold possession', 'hold'],
  },
  PRESS: { [LanguageEnum.ES]: ['presionar', 'presion'], [LanguageEnum.EN]: ['press'] },
  LONG_PASS: { [LanguageEnum.ES]: ['pase largo', 'largo'], [LanguageEnum.EN]: ['long pass'] },
  SHOOT: { [LanguageEnum.ES]: ['rematar', 'disparar', 'tiro'], [LanguageEnum.EN]: ['shoot'] },
  PASS: { [LanguageEnum.ES]: ['pase', 'pasar'], [LanguageEnum.EN]: ['pass'] },
  DRIBBLE: { [LanguageEnum.ES]: ['gambetear', 'regatear', 'driblar'], [LanguageEnum.EN]: ['dribble'] },
  CROSS: { [LanguageEnum.ES]: ['centro', 'centrar'], [LanguageEnum.EN]: ['cross'] },
  DEFEND: { [LanguageEnum.ES]: ['defender', 'defensa'], [LanguageEnum.EN]: ['defend'] },
  LEFT: { [LanguageEnum.ES]: ['izquierda'], [LanguageEnum.EN]: ['left'] },
  RIGHT: { [LanguageEnum.ES]: ['derecha'], [LanguageEnum.EN]: ['right'] },
  CENTER: { [LanguageEnum.ES]: ['centro'], [LanguageEnum.EN]: ['center'] },
  PICAR: { [LanguageEnum.ES]: ['picar'], [LanguageEnum.EN]: ['chip'] },
  DIVE_LEFT: {
    [LanguageEnum.ES]: ['tirarse izquierda', 'lanzarse izquierda'],
    [LanguageEnum.EN]: ['dive left'],
  },
  DIVE_RIGHT: {
    [LanguageEnum.ES]: ['tirarse derecha', 'lanzarse derecha'],
    [LanguageEnum.EN]: ['dive right'],
  },
  STAY_CENTER: {
    [LanguageEnum.ES]: ['quedarse centro', 'mantener centro'],
    [LanguageEnum.EN]: ['stay center'],
  },
  WAIT: { [LanguageEnum.ES]: ['esperar'], [LanguageEnum.EN]: ['wait'] },
  BLOCK: { [LanguageEnum.ES]: ['bloquear', 'cerrar espacios'], [LanguageEnum.EN]: ['block'] },
  TACKLE: { [LanguageEnum.ES]: ['barrida', 'entrada'], [LanguageEnum.EN]: ['tackle'] },
  QUIT_MATCH: {
    [LanguageEnum.ES]: ['salir del partido', 'salir'],
    [LanguageEnum.EN]: ['quit match', 'quit'],
  },
};

export function getStageLabel(stage: string | undefined, lang: LanguageEnum): string {
  const normalizedStage = (stage ?? '').trim().toUpperCase();
  const fallbackStageLabel = normalizedStage || 'N/A';
  return STAGE_LABELS[normalizedStage]?.[lang] ?? fallbackStageLabel;
}

export function getResultLabel(result: string, lang: LanguageEnum): string {
  return RESULT_LABELS[result]?.[lang] ?? result;
}

export function getResolutionLabel(resolution: string, lang: LanguageEnum): string {
  return RESOLUTION_LABELS[resolution]?.[lang] ?? resolution;
}

export function getPendingLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Pendiente' : 'Pending';
}

export function getAllLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Todos' : 'All';
}

export function getHomeLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Local' : 'Home';
}

export function getAwayLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Visitante' : 'Away';
}

export function getNoZoneLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Sin zona' : 'No zone';
}

export function getZoneLabel(zone: string | null | undefined, lang: LanguageEnum): string {
  const normalizedZone = (zone ?? '').trim().toUpperCase();
  if (!normalizedZone) {
    return getNoZoneLabel(lang);
  }

  return ZONE_LABELS[normalizedZone]?.[lang] ?? normalizedZone;
}

export function getPenaltiesScoreLabel(lang: LanguageEnum, home: number, away: number): string {
  return lang === LanguageEnum.ES ? `Penales ${home}-${away}` : `Penalties ${home}-${away}`;
}

export function getEndedStatusLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Finalizado' : 'Ended';
}

export function getEditionUnavailableLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Edicion N/A' : 'Edition N/A';
}

export function getOtherInternationalTitlesLabel(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES ? 'Otros titulos internacionales' : 'Other International Titles';
}

export function getAwardLabel(code: string, lang: LanguageEnum): string {
  return AWARD_LABELS[code]?.[lang] ?? code.replace(/_/g, ' ');
}

export function getAwardFallbackReason(lang: LanguageEnum): string {
  return lang === LanguageEnum.ES
    ? 'Rendimiento destacado en el torneo.'
    : 'Outstanding tournament performance.';
}

export function getPodiumPlaceLabel(place: string, lang: LanguageEnum): string {
  return PODIUM_LABELS[place]?.[lang] ?? place;
}

export function getActionLabels(action: string): Record<LanguageEnum, string[]> {
  return ACTION_LABELS[action] ?? { [LanguageEnum.EN]: [], [LanguageEnum.ES]: [] };
}

export function getActionDefaultLabel(action: string, lang: LanguageEnum): string {
  const labels = getActionLabels(action);
  return labels[lang][0] ?? action;
}
