import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchAction } from 'src/match/model/match-action.enum';
import { MatchEventType } from 'src/match/model/match-event-type.enum';
import { MatchFieldZone } from 'src/match/model/match-field-zone.enum';
import { MatchFormation } from 'src/match/model/match-formation.enum';
import { MatchLanguage } from 'src/match/model/match-language.model';
import { MatchMessageType } from 'src/match/model/match-message-type.enum';
import { MatchStrategy } from 'src/match/model/match-strategy.enum';
import { CoachProfile } from 'src/teams/model/coach-profile.enum';
import {
  LocalizedDictionaryItem,
  LocalizedText,
} from './interfaces/reference-dictionary.interface';
import { GameDictionaryItem } from './model/game-dictionary-item.model';
import { GameDictionary } from './model/game-dictionary.model';

@Injectable()
/**
 * Provides educational reference dictionaries for frontend/backend students
 * that are not familiar with football terms used by the match engine.
 */
export class ReferenceService {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Returns the full game dictionary grouped by category.
   */
  getGameDictionary(inputLang?: string): GameDictionary {
    const lang = this.normalizeLanguage(inputLang);

    return {
      lang,
      positions: this.localizeItems(POSITIONS, lang),
      zones: this.localizeItems(this.buildZones(), lang),
      actions: this.localizeItems(this.buildActions(), lang),
      events: this.localizeItems(EVENTS, lang),
      messageTypes: this.localizeItems(MESSAGE_TYPES, lang),
      stats: this.localizeItems(STATS, lang),
      strategies: this.localizeItems(STRATEGIES, lang),
      formations: this.localizeItems(FORMATIONS, lang),
      footballTerms: this.localizeItems(FOOTBALL_TERMS, lang),
    };
  }

  /**
   * Returns localized coach profile definitions for educational UIs.
   */
  getCoachProfiles(inputLang?: string): GameDictionaryItem[] {
    const lang = this.normalizeLanguage(inputLang);
    return this.localizeItems(this.buildCoachProfiles(), lang);
  }

  /**
   * Normalizes language query parameter.
   * Supported: en/es. Any unsupported value falls back to en.
   */
  private normalizeLanguage(lang?: string): MatchLanguage {
    if (!lang) {
      return 'en';
    }

    const normalized = lang.trim().toLowerCase();

    if (normalized === 'es') {
      return 'es';
    }

    return 'en';
  }

  /**
   * Maps localized dictionary entries into the selected language.
   */
  private localizeItems(items: LocalizedDictionaryItem[], lang: MatchLanguage): GameDictionaryItem[] {
    return items.map((item) => ({
      code: item.code,
      label: item.label[lang],
      description: item.description[lang],
      example: item.example ? item.example[lang] : null,
    }));
  }

  /**
   * Builds zone catalog using existing i18n zone labels.
   */
  private buildZones(): LocalizedDictionaryItem[] {
    return Object.values(MatchFieldZone).map((zone) => ({
      code: zone,
      label: {
        en: this.i18nService.t(`match.zone.${zone}`, 'en'),
        es: this.i18nService.t(`match.zone.${zone}`, 'es'),
      },
      description: ZONE_DESCRIPTIONS[zone],
      example: ZONE_EXAMPLES[zone],
    }));
  }

  /**
   * Builds actions catalog using existing action labels.
   */
  private buildActions(): LocalizedDictionaryItem[] {
    return Object.values(MatchAction).map((action) => ({
      code: action,
      label: {
        en: this.i18nService.t(`match.action.${action}`, 'en'),
        es: this.i18nService.t(`match.action.${action}`, 'es'),
      },
      description: ACTION_DESCRIPTIONS[action],
      example: ACTION_EXAMPLES[action],
    }));
  }

  /**
   * Builds coach profile catalog using centralized i18n keys.
   */
  private buildCoachProfiles(): LocalizedDictionaryItem[] {
    return Object.values(CoachProfile).map((profile) => ({
      code: profile,
      label: {
        en: this.i18nService.t(`coach.profile.label.${profile}`, 'en'),
        es: this.i18nService.t(`coach.profile.label.${profile}`, 'es'),
      },
      description: {
        en: this.i18nService.t(`coach.profile.description.${profile}`, 'en'),
        es: this.i18nService.t(`coach.profile.description.${profile}`, 'es'),
      },
      example: {
        en: this.i18nService.t(`coach.profile.example.${profile}`, 'en'),
        es: this.i18nService.t(`coach.profile.example.${profile}`, 'es'),
      },
    }));
  }
}

const POSITIONS: LocalizedDictionaryItem[] = [
  {
    code: 'GK',
    label: { en: 'Goalkeeper', es: 'Arquero' },
    description: {
      en: 'Protects the goal and can use hands inside the box.',
      es: 'Protege el arco y puede usar las manos dentro del área.',
    },
    example: {
      en: 'In PENALTY_AGAINST_EVENT, the goalkeeper tries to save the shot.',
      es: 'En PENALTY_AGAINST_EVENT, el arquero intenta atajar el remate.',
    },
  },
  {
    code: 'DF',
    label: { en: 'Defender', es: 'Defensor' },
    description: {
      en: 'Defensive player focused on recovering the ball and blocking attacks.',
      es: 'Jugador defensivo enfocado en recuperar la pelota y frenar ataques.',
    },
  },
  {
    code: 'MF',
    label: { en: 'Midfielder', es: 'Mediocampista' },
    description: {
      en: 'Connects defense and attack, usually key in possession and passing.',
      es: 'Conecta defensa y ataque, clave en posesión y distribución.',
    },
  },
  {
    code: 'FW',
    label: { en: 'Forward', es: 'Delantero' },
    description: {
      en: 'Attacking player with higher probability to finish chances and score.',
      es: 'Jugador ofensivo con mayor probabilidad de definir y marcar goles.',
    },
  },
];

const ZONE_DESCRIPTIONS: Record<MatchFieldZone, LocalizedText> = {
  [MatchFieldZone.DEFENSE_THIRD]: {
    en: 'Area near your own goal, where defensive actions are safer.',
    es: 'Zona cercana a tu arco, donde convienen acciones defensivas.',
  },
  [MatchFieldZone.MIDFIELD]: {
    en: 'Middle area of the field where possession and transitions are decided.',
    es: 'Zona media del campo, donde se define la posesión y las transiciones.',
  },
  [MatchFieldZone.ATTACK_THIRD]: {
    en: 'Advanced area near rival goal, useful for creating chances.',
    es: 'Zona avanzada cerca del arco rival, útil para crear chances.',
  },
  [MatchFieldZone.BOX]: {
    en: 'Penalty area, highest danger zone for goals and penalties.',
    es: 'Área penal, zona de mayor peligro para goles y penales.',
  },
};

const ZONE_EXAMPLES: Record<MatchFieldZone, LocalizedText> = {
  [MatchFieldZone.DEFENSE_THIRD]: {
    en: 'Press, defend, and clear actions are usually stronger here.',
    es: 'Presionar, defender y despejar suelen funcionar mejor acá.',
  },
  [MatchFieldZone.MIDFIELD]: {
    en: 'Pass, hold, and long pass can change momentum in this zone.',
    es: 'Pasar, mantener y pase largo pueden cambiar el ritmo en esta zona.',
  },
  [MatchFieldZone.ATTACK_THIRD]: {
    en: 'Dribble, cross, and shoot become more impactful here.',
    es: 'Gambetear, centro y patear tienen más impacto en esta zona.',
  },
  [MatchFieldZone.BOX]: {
    en: 'Shoot or penalties can produce direct goals from this zone.',
    es: 'Patear o penales pueden generar gol directo en esta zona.',
  },
};

const ACTION_DESCRIPTIONS: Record<MatchAction, LocalizedText> = {
  [MatchAction.RESTART_MATCH]: {
    en: 'Resumes the match from halftime into the second half.',
    es: 'Reanuda el partido desde el entretiempo hacia el segundo tiempo.',
  },
  [MatchAction.ATTACK]: {
    en: 'Pushes the team forward with offensive intent.',
    es: 'Empuja al equipo hacia adelante con intención ofensiva.',
  },
  [MatchAction.HOLD]: {
    en: 'Keeps possession and lowers risk of immediate ball loss.',
    es: 'Mantiene la posesión y baja el riesgo de pérdida inmediata.',
  },
  [MatchAction.PRESS]: {
    en: 'Applies pressure to recover the ball quickly.',
    es: 'Aplica presión para recuperar la pelota rápido.',
  },
  [MatchAction.LONG_PASS]: {
    en: 'Attempts a direct progression with a long ball.',
    es: 'Intenta progresar de forma directa con pase largo.',
  },
  [MatchAction.SHOOT]: {
    en: 'Attempts to score with a shot.',
    es: 'Intenta convertir con un remate.',
  },
  [MatchAction.PASS]: {
    en: 'Moves the ball to a teammate and builds play.',
    es: 'Mueve la pelota a un compañero y construye la jugada.',
  },
  [MatchAction.DRIBBLE]: {
    en: 'Tries to beat a defender in one-on-one play.',
    es: 'Intenta superar a un defensor en un mano a mano.',
  },
  [MatchAction.CROSS]: {
    en: 'Sends the ball into the area from wide positions.',
    es: 'Envía la pelota al área desde una banda.',
  },
  [MatchAction.DEFEND]: {
    en: 'Prioritizes defensive shape and risk control.',
    es: 'Prioriza el orden defensivo y el control del riesgo.',
  },
  [MatchAction.LEFT]: {
    en: 'Places the penalty shot to the left side.',
    es: 'Define el penal hacia la izquierda.',
  },
  [MatchAction.RIGHT]: {
    en: 'Places the penalty shot to the right side.',
    es: 'Define el penal hacia la derecha.',
  },
  [MatchAction.CENTER]: {
    en: 'Places the shot down the center.',
    es: 'Define el remate al centro.',
  },
  [MatchAction.PICAR]: {
    en: 'Chip penalty style shot with higher risk and style.',
    es: 'Remate picado de penal, con más riesgo y estilo.',
  },
  [MatchAction.DIVE_LEFT]: {
    en: 'Goalkeeper dives left to save.',
    es: 'El arquero se tira a la izquierda para atajar.',
  },
  [MatchAction.DIVE_RIGHT]: {
    en: 'Goalkeeper dives right to save.',
    es: 'El arquero se tira a la derecha para atajar.',
  },
  [MatchAction.STAY_CENTER]: {
    en: 'Goalkeeper holds central position for the save.',
    es: 'El arquero se queda al centro para atajar.',
  },
  [MatchAction.WAIT]: {
    en: 'Goalkeeper delays movement to read the shooter.',
    es: 'El arquero espera para leer al pateador.',
  },
  [MatchAction.BLOCK]: {
    en: 'Closes lanes and blocks spaces near dangerous zones.',
    es: 'Cierra líneas y bloquea espacios en zonas peligrosas.',
  },
  [MatchAction.TACKLE]: {
    en: 'Attempts a direct tackle to win the ball.',
    es: 'Intenta una barrida directa para recuperar la pelota.',
  },
  [MatchAction.QUIT_MATCH]: {
    en: 'Forfeits the final immediately.',
    es: 'Abandona la final de forma inmediata.',
  },
};

const ACTION_EXAMPLES: Record<MatchAction, LocalizedText> = {
  [MatchAction.RESTART_MATCH]: {
    en: 'Use this at halftime to continue the match.',
    es: 'Usala en el entretiempo para continuar el partido.',
  },
  [MatchAction.ATTACK]: {
    en: 'Useful when your team has momentum in midfield.',
    es: 'Útil cuando tu equipo tiene impulso en el mediocampo.',
  },
  [MatchAction.HOLD]: {
    en: 'Good choice to avoid risky transitions.',
    es: 'Buena opción para evitar transiciones riesgosas.',
  },
  [MatchAction.PRESS]: {
    en: 'Can recover possession quickly after losing the ball.',
    es: 'Puede recuperar la posesión rápido tras perderla.',
  },
  [MatchAction.LONG_PASS]: {
    en: 'Can create direct one-on-one chances.',
    es: 'Puede generar situaciones directas de mano a mano.',
  },
  [MatchAction.SHOOT]: {
    en: 'More effective in ATTACK_THIRD or BOX zones.',
    es: 'Más efectivo en ATTACK_THIRD o BOX.',
  },
  [MatchAction.PASS]: {
    en: 'Helps keep tempo and improve positional play.',
    es: 'Ayuda a sostener el ritmo y mejorar el juego posicional.',
  },
  [MatchAction.DRIBBLE]: {
    en: 'Can beat pressure but also risks losing possession.',
    es: 'Puede romper presión pero también arriesga perder la pelota.',
  },
  [MatchAction.CROSS]: {
    en: 'Can produce headers or second-ball chances.',
    es: 'Puede generar cabezazos o segundas jugadas.',
  },
  [MatchAction.DEFEND]: {
    en: 'Recommended when the rival controls the action.',
    es: 'Recomendado cuando el rival controla la jugada.',
  },
  [MatchAction.LEFT]: {
    en: 'Penalty direction decision.',
    es: 'Decisión de dirección en penal.',
  },
  [MatchAction.RIGHT]: {
    en: 'Penalty direction decision.',
    es: 'Decisión de dirección en penal.',
  },
  [MatchAction.CENTER]: {
    en: 'Penalty direction decision.',
    es: 'Decisión de dirección en penal.',
  },
  [MatchAction.PICAR]: {
    en: 'A stylish but risky penalty option.',
    es: 'Una opción de penal vistosa pero riesgosa.',
  },
  [MatchAction.DIVE_LEFT]: {
    en: 'Goalkeeper action during penalties.',
    es: 'Acción de arquero durante penales.',
  },
  [MatchAction.DIVE_RIGHT]: {
    en: 'Goalkeeper action during penalties.',
    es: 'Acción de arquero durante penales.',
  },
  [MatchAction.STAY_CENTER]: {
    en: 'Goalkeeper action during penalties.',
    es: 'Acción de arquero durante penales.',
  },
  [MatchAction.WAIT]: {
    en: 'Goalkeeper action during penalties.',
    es: 'Acción de arquero durante penales.',
  },
  [MatchAction.BLOCK]: {
    en: 'Strong defensive action to reduce shot quality.',
    es: 'Acción defensiva fuerte para reducir calidad de remate.',
  },
  [MatchAction.TACKLE]: {
    en: 'Can stop an attack but may trigger fouls/cards.',
    es: 'Puede frenar un ataque, pero puede generar faltas/tarjetas.',
  },
  [MatchAction.QUIT_MATCH]: {
    en: 'Ends the match with forfeit result.',
    es: 'Termina el partido con resultado por abandono.',
  },
};

const EVENTS: LocalizedDictionaryItem[] = [
  {
    code: MatchEventType.KICKOFF_EVENT,
    label: { en: 'Kickoff', es: 'Saque inicial' },
    description: {
      en: 'Restart from midfield after start or after a goal.',
      es: 'Reinicio desde el mediocampo al inicio o después de un gol.',
    },
  },
  {
    code: MatchEventType.HALF_TIME_EVENT,
    label: { en: 'Half-time', es: 'Entretiempo' },
    description: {
      en: 'Mid-match break with options to restart the second half or quit.',
      es: 'Pausa de mitad de partido con opciones para reanudar o salir.',
    },
  },
  {
    code: MatchEventType.BALL_POSSESSION_EVENT,
    label: { en: 'Ball possession', es: 'Posesión de balón' },
    description: {
      en: 'Open-play scenario where teams build attack or defend.',
      es: 'Escenario de juego abierto donde se construye ataque o defensa.',
    },
  },
  {
    code: MatchEventType.ATTACK_EVENT,
    label: { en: 'Attack in rival side', es: 'Ataque en campo rival' },
    description: {
      en: 'Attacking phase near rival goal.',
      es: 'Fase ofensiva cerca del arco rival.',
    },
  },
  {
    code: MatchEventType.DEFENSE_EVENT,
    label: { en: 'Defending own side', es: 'Defensa en campo propio' },
    description: {
      en: 'Defensive phase near own goal.',
      es: 'Fase defensiva cerca del arco propio.',
    },
  },
  {
    code: MatchEventType.FREE_KICK_FOR_EVENT,
    label: { en: 'Free kick for user team', es: 'Tiro libre a favor' },
    description: {
      en: 'Set piece awarded to the user team.',
      es: 'Pelota parada otorgada al equipo del usuario.',
    },
  },
  {
    code: MatchEventType.FREE_KICK_AGAINST_EVENT,
    label: { en: 'Free kick against user team', es: 'Tiro libre en contra' },
    description: {
      en: 'Set piece awarded to the opponent team.',
      es: 'Pelota parada otorgada al equipo rival.',
    },
  },
  {
    code: MatchEventType.PENALTY_FOR_EVENT,
    label: { en: 'Penalty for user team', es: 'Penal a favor' },
    description: {
      en: 'Penalty shot for the user team.',
      es: 'Remate de penal para el equipo del usuario.',
    },
  },
  {
    code: MatchEventType.PENALTY_AGAINST_EVENT,
    label: { en: 'Penalty against user team', es: 'Penal en contra' },
    description: {
      en: 'Opponent takes a penalty against the user team goalkeeper.',
      es: 'El rival ejecuta un penal contra el arquero del usuario.',
    },
  },
  {
    code: MatchEventType.CORNER_FOR_EVENT,
    label: { en: 'Corner for user team', es: 'Corner a favor' },
    description: {
      en: 'Corner kick for the user team in rival area.',
      es: 'Tiro de esquina para el equipo del usuario en área rival.',
    },
  },
  {
    code: MatchEventType.CORNER_AGAINST_EVENT,
    label: { en: 'Corner against user team', es: 'Corner en contra' },
    description: {
      en: 'Corner kick for the opponent team.',
      es: 'Tiro de esquina para el equipo rival.',
    },
  },
  {
    code: MatchEventType.THROW_IN_FOR_EVENT,
    label: { en: 'Throw-in for user team', es: 'Lateral a favor' },
    description: {
      en: 'Throw-in restart awarded to user team.',
      es: 'Reinicio con lateral otorgado al equipo del usuario.',
    },
  },
  {
    code: MatchEventType.THROW_IN_AGAINST_EVENT,
    label: { en: 'Throw-in against user team', es: 'Lateral en contra' },
    description: {
      en: 'Throw-in restart awarded to opponent team.',
      es: 'Reinicio con lateral otorgado al equipo rival.',
    },
  },
  {
    code: MatchEventType.YELLOW_CARD_EVENT,
    label: { en: 'Yellow card', es: 'Tarjeta amarilla' },
    description: {
      en: 'Warning sanction after a foul.',
      es: 'Sanción de advertencia luego de una falta.',
    },
  },
  {
    code: MatchEventType.RED_CARD_EVENT,
    label: { en: 'Red card', es: 'Tarjeta roja' },
    description: {
      en: 'Expulsion. Team continues with one less player.',
      es: 'Expulsión. El equipo sigue con un jugador menos.',
    },
  },
  {
    code: MatchEventType.LAST_PLAY_ONE_ON_ONE_FOR_EVENT,
    label: { en: 'Last play one-on-one for user', es: 'Última jugada mano a mano a favor' },
    description: {
      en: 'Final decisive one-on-one chance for user team.',
      es: 'Última chance decisiva de mano a mano para el usuario.',
    },
  },
  {
    code: MatchEventType.LAST_PLAY_ONE_ON_ONE_AGAINST_EVENT,
    label: { en: 'Last play one-on-one against user', es: 'Última jugada mano a mano en contra' },
    description: {
      en: 'Final decisive one-on-one chance for opponent.',
      es: 'Última chance decisiva de mano a mano para el rival.',
    },
  },
  {
    code: MatchEventType.LAST_PLAY_PENALTY_FOR_EVENT,
    label: { en: 'Last play penalty for user', es: 'Última jugada penal a favor' },
    description: {
      en: 'Final decisive penalty for user team.',
      es: 'Último penal decisivo para el equipo del usuario.',
    },
  },
  {
    code: MatchEventType.LAST_PLAY_PENALTY_AGAINST_EVENT,
    label: { en: 'Last play penalty against user', es: 'Última jugada penal en contra' },
    description: {
      en: 'Final decisive penalty for opponent team.',
      es: 'Último penal decisivo para el equipo rival.',
    },
  },
  {
    code: MatchEventType.FORFEIT_EVENT,
    label: { en: 'Forfeit', es: 'Abandono' },
    description: {
      en: 'Match ends because the user team quits.',
      es: 'El partido termina porque el equipo del usuario abandona.',
    },
  },
  {
    code: MatchEventType.END,
    label: { en: 'Match end', es: 'Fin del partido' },
    description: {
      en: 'Terminal match state after final whistle.',
      es: 'Estado terminal del partido tras el pitazo final.',
    },
  },
];

const MESSAGE_TYPE_LABELS: Record<MatchMessageType, LocalizedText> = {
  [MatchMessageType.CONTEXT]: { en: 'Context', es: 'Contexto' },
  [MatchMessageType.PLAYER_ACTION]: { en: 'Player action', es: 'Acción del jugador' },
  [MatchMessageType.OPPONENT_REACTION]: { en: 'Consequence', es: 'Consecuencia' },
  [MatchMessageType.RESULT]: { en: 'Result', es: 'Resultado' },
  [MatchMessageType.SUBSTITUTION]: { en: 'Substitution', es: 'Sustitución' },
  [MatchMessageType.INJURY]: { en: 'Injury', es: 'Lesión' },
  [MatchMessageType.YELLOW_CARD]: { en: 'Yellow card', es: 'Tarjeta amarilla' },
  [MatchMessageType.RED_CARD]: { en: 'Red card', es: 'Tarjeta roja' },
  [MatchMessageType.RESTART]: { en: 'Restart', es: 'Reinicio' },
  [MatchMessageType.LAST_PLAY]: { en: 'Last play', es: 'Última jugada' },
  [MatchMessageType.FINAL]: { en: 'Final', es: 'Final' },
  [MatchMessageType.INFO]: { en: 'Info', es: 'Información' },
};

const MESSAGE_TYPE_DESCRIPTIONS: Record<MatchMessageType, LocalizedText> = {
  [MatchMessageType.CONTEXT]: {
    en: 'Describes where play happens and who has the ball.',
    es: 'Describe dónde ocurre la jugada y quién tiene la pelota.',
  },
  [MatchMessageType.PLAYER_ACTION]: {
    en: 'Confirms the option selected by the user.',
    es: 'Confirma la opción seleccionada por el usuario.',
  },
  [MatchMessageType.OPPONENT_REACTION]: {
    en: 'Explains the direct consequence of the previous action.',
    es: 'Explica la consecuencia directa de la acción anterior.',
  },
  [MatchMessageType.RESULT]: {
    en: 'Shows the turn outcome (goal, no finish, defense hold, etc.).',
    es: 'Muestra el resultado del turno (gol, sin definición, defensa firme, etc.).',
  },
  [MatchMessageType.SUBSTITUTION]: {
    en: 'Indicates a player substitution event.',
    es: 'Indica un evento de sustitución de jugador.',
  },
  [MatchMessageType.INJURY]: {
    en: 'Indicates injury impact in squad status.',
    es: 'Indica impacto por lesión en el estado del plantel.',
  },
  [MatchMessageType.YELLOW_CARD]: {
    en: 'Indicates a yellow card sanction.',
    es: 'Indica una sanción de tarjeta amarilla.',
  },
  [MatchMessageType.RED_CARD]: {
    en: 'Indicates a red card and expulsion.',
    es: 'Indica una tarjeta roja y expulsión.',
  },
  [MatchMessageType.RESTART]: {
    en: 'Explains how play restarts (kickoff, corner, free kick, throw-in).',
    es: 'Explica cómo se reinicia el juego (saque, corner, tiro libre, lateral).',
  },
  [MatchMessageType.LAST_PLAY]: {
    en: 'Narrates last-play tension and decisive sequence.',
    es: 'Narra la tensión y secuencia decisiva de última jugada.',
  },
  [MatchMessageType.FINAL]: {
    en: 'End-of-match summary message.',
    es: 'Mensaje de cierre del partido.',
  },
  [MatchMessageType.INFO]: {
    en: 'Additional informational message.',
    es: 'Mensaje informativo adicional.',
  },
};

const MESSAGE_TYPES: LocalizedDictionaryItem[] = Object.values(MatchMessageType).map((type) => ({
  code: type,
  label: MESSAGE_TYPE_LABELS[type],
  description: MESSAGE_TYPE_DESCRIPTIONS[type],
}));

const STATS: LocalizedDictionaryItem[] = [
  {
    code: 'rating',
    label: { en: 'Team rating', es: 'Rating del equipo' },
    description: {
      en: 'Base team strength used by world cup simulator for match probability.',
      es: 'Fuerza base del equipo usada por el simulador del mundial.',
    },
  },
  {
    code: 'overall',
    label: { en: 'Overall', es: 'Overall' },
    description: {
      en: 'Global team level shown in team stats.',
      es: 'Nivel global del equipo mostrado en estadísticas.',
    },
  },
  {
    code: 'attack',
    label: { en: 'Attack', es: 'Ataque' },
    description: {
      en: 'Offensive capacity to create and finish chances.',
      es: 'Capacidad ofensiva para crear y definir ocasiones.',
    },
  },
  {
    code: 'defense',
    label: { en: 'Defense', es: 'Defensa' },
    description: {
      en: 'Defensive capacity to stop chances and protect the goal.',
      es: 'Capacidad defensiva para frenar ocasiones y proteger el arco.',
    },
  },
  {
    code: 'midfield',
    label: { en: 'Midfield', es: 'Mediocampo' },
    description: {
      en: 'Control and transition strength in central areas.',
      es: 'Control y transición en la zona central del campo.',
    },
  },
  {
    code: 'skill',
    label: { en: 'Player skill', es: 'Habilidad del jugador' },
    description: {
      en: 'Technical quality of each player for match engine calculations.',
      es: 'Calidad técnica de cada jugador para cálculos del motor.',
    },
  },
  {
    code: 'energy',
    label: { en: 'Player energy', es: 'Energía del jugador' },
    description: {
      en: 'Stamina value that drops through turns and affects substitutions/performance.',
      es: 'Resistencia que baja con los turnos y afecta cambios/rendimiento.',
    },
  },
];

const STRATEGIES: LocalizedDictionaryItem[] = [
  {
    code: MatchStrategy.ATTACK,
    label: { en: 'Attack', es: 'Ataque' },
    description: {
      en: 'Prioritizes offensive actions and chance creation.',
      es: 'Prioriza acciones ofensivas y creación de chances.',
    },
  },
  {
    code: MatchStrategy.DEFENSE,
    label: { en: 'Defense', es: 'Defensa' },
    description: {
      en: 'Prioritizes compact shape and defensive stability.',
      es: 'Prioriza bloque compacto y estabilidad defensiva.',
    },
  },
  {
    code: MatchStrategy.PENALTIES,
    label: { en: 'Penalties', es: 'Penales' },
    description: {
      en: 'Improves behavior in penalty-related situations.',
      es: 'Mejora comportamiento en situaciones relacionadas a penales.',
    },
  },
  {
    code: MatchStrategy.COUNTER_ATTACK,
    label: { en: 'Counter attack', es: 'Contraataque' },
    description: {
      en: 'Looks for fast transitions after recovery.',
      es: 'Busca transiciones rápidas después de recuperar.',
    },
  },
  {
    code: MatchStrategy.BALANCED,
    label: { en: 'Balanced', es: 'Balanceada' },
    description: {
      en: 'Neutral profile, works with any formation.',
      es: 'Perfil neutral, compatible con cualquier formación.',
    },
  },
  {
    code: MatchStrategy.POSSESSION,
    label: { en: 'Possession', es: 'Posesión' },
    description: {
      en: 'Prioritizes circulation, control, and midfield dominance.',
      es: 'Prioriza circulación, control y dominio del mediocampo.',
    },
  },
];

const FORMATIONS: LocalizedDictionaryItem[] = [
  {
    code: MatchFormation.F_4_3_3,
    label: { en: '4-3-3', es: '4-3-3' },
    description: { en: 'Attacking width with three forwards.', es: 'Ancho ofensivo con tres delanteros.' },
  },
  {
    code: MatchFormation.F_4_4_2,
    label: { en: '4-4-2', es: '4-4-2' },
    description: { en: 'Classic balanced shape in two lines of four.', es: 'Esquema clásico equilibrado en dos líneas de cuatro.' },
  },
  {
    code: MatchFormation.F_4_2_3_1,
    label: { en: '4-2-3-1', es: '4-2-3-1' },
    description: { en: 'Double pivot plus attacking midfielder line.', es: 'Doble pivote con línea de mediapuntas.' },
  },
  {
    code: MatchFormation.F_3_5_2,
    label: { en: '3-5-2', es: '3-5-2' },
    description: { en: 'Three center-backs and aggressive wingbacks.', es: 'Tres centrales y carrileros ofensivos.' },
  },
  {
    code: MatchFormation.F_3_4_3,
    label: { en: '3-4-3', es: '3-4-3' },
    description: { en: 'High pressing with three attackers.', es: 'Presión alta con tres atacantes.' },
  },
  {
    code: MatchFormation.F_4_1_4_1,
    label: { en: '4-1-4-1', es: '4-1-4-1' },
    description: { en: 'Defensive anchor with compact midfield line.', es: 'Ancla defensiva con línea de mediocampo compacta.' },
  },
  {
    code: MatchFormation.F_4_5_1,
    label: { en: '4-5-1', es: '4-5-1' },
    description: { en: 'Defensive setup with one striker.', es: 'Planteo defensivo con un delantero.' },
  },
  {
    code: MatchFormation.F_5_3_2,
    label: { en: '5-3-2', es: '5-3-2' },
    description: { en: 'Solid back five and two forwards for transitions.', es: 'Línea de cinco sólida y dos puntas para transiciones.' },
  },
  {
    code: MatchFormation.F_5_4_1,
    label: { en: '5-4-1', es: '5-4-1' },
    description: { en: 'Very defensive structure with compact blocks.', es: 'Estructura muy defensiva con bloques compactos.' },
  },
  {
    code: MatchFormation.F_4_1_2_1_2,
    label: { en: '4-1-2-1-2', es: '4-1-2-1-2' },
    description: { en: 'Diamond midfield with central overload.', es: 'Rombo en el medio con sobrecarga central.' },
  },
  {
    code: MatchFormation.F_4_3_2_1,
    label: { en: '4-3-2-1', es: '4-3-2-1' },
    description: { en: 'Narrow shape with two creators behind striker.', es: 'Esquema angosto con dos creadores detrás del punta.' },
  },
  {
    code: MatchFormation.F_3_4_1_2,
    label: { en: '3-4-1-2', es: '3-4-1-2' },
    description: { en: 'Playmaker behind two forwards.', es: 'Enganche detrás de dos delanteros.' },
  },
  {
    code: MatchFormation.F_4_4_1_1,
    label: { en: '4-4-1-1', es: '4-4-1-1' },
    description: { en: 'Support striker behind main striker.', es: 'Mediapunta detrás del delantero principal.' },
  },
  {
    code: MatchFormation.F_4_3_1_2,
    label: { en: '4-3-1-2', es: '4-3-1-2' },
    description: { en: 'Central-heavy setup with two strikers.', es: 'Esquema central con dos delanteros.' },
  },
  {
    code: MatchFormation.F_3_1_4_2,
    label: { en: '3-1-4-2', es: '3-1-4-2' },
    description: { en: 'Three defenders with a holding midfielder pivot.', es: 'Tres defensores con pivote de contención.' },
  },
];

const FOOTBALL_TERMS: LocalizedDictionaryItem[] = [
  {
    code: 'KICKOFF',
    label: { en: 'Kickoff', es: 'Saque del medio' },
    description: {
      en: 'Restart from midfield after a goal or at match start.',
      es: 'Reinicio desde el mediocampo tras un gol o al inicio.',
    },
  },
  {
    code: 'COUNTER_ATTACK',
    label: { en: 'Counter attack', es: 'Contraataque' },
    description: {
      en: 'Fast attack immediately after recovering the ball.',
      es: 'Ataque rápido justo después de recuperar la pelota.',
    },
  },
  {
    code: 'PRESSING',
    label: { en: 'Pressing', es: 'Presión' },
    description: {
      en: 'Aggressive pressure to force mistakes and recover possession.',
      es: 'Presión agresiva para forzar errores y recuperar posesión.',
    },
  },
  {
    code: 'ONE_ON_ONE',
    label: { en: 'One-on-one', es: 'Mano a mano' },
    description: {
      en: 'Attacker faces goalkeeper directly.',
      es: 'El delantero queda frente al arquero sin defensores directos.',
    },
  },
  {
    code: 'SET_PIECE',
    label: { en: 'Set piece', es: 'Pelota parada' },
    description: {
      en: 'Restart situations like free kicks, corners, and penalties.',
      es: 'Situaciones de reinicio como tiros libres, corners y penales.',
    },
  },
  {
    code: 'FORFEIT',
    label: { en: 'Forfeit', es: 'Abandono' },
    description: {
      en: 'Team quits and match ends immediately.',
      es: 'El equipo abandona y el partido termina inmediatamente.',
    },
  },
];
