import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiVisualsService {
  private static readonly TEAM_FLAGS: Record<string, string> = {
    alg: '🇩🇿',
    arg: '🇦🇷',
    aus: '🇦🇺',
    aut: '🇦🇹',
    bel: '🇧🇪',
    bih: '🇧🇦',
    bra: '🇧🇷',
    can: '🇨🇦',
    civ: '🇨🇮',
    col: '🇨🇴',
    cpv: '🇨🇻',
    cro: '🇭🇷',
    cuw: '🇨🇼',
    cze: '🇨🇿',
    drc: '🇨🇩',
    ecu: '🇪🇨',
    egy: '🇪🇬',
    eng: '🇬🇧',
    esp: '🇪🇸',
    fra: '🇫🇷',
    ger: '🇩🇪',
    gha: '🇬🇭',
    hai: '🇭🇹',
    irn: '🇮🇷',
    irq: '🇮🇶',
    jor: '🇯🇴',
    jpn: '🇯🇵',
    kor: '🇰🇷',
    mar: '🇲🇦',
    mex: '🇲🇽',
    ned: '🇳🇱',
    nor: '🇳🇴',
    nzl: '🇳🇿',
    pan: '🇵🇦',
    par: '🇵🇾',
    por: '🇵🇹',
    qat: '🇶🇦',
    rsa: '🇿🇦',
    sau: '🇸🇦',
    sco: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    sen: '🇸🇳',
    sui: '🇨🇭',
    swe: '🇸🇪',
    tun: '🇹🇳',
    tur: '🇹🇷',
    uru: '🇺🇾',
    usa: '🇺🇸',
    uzb: '🇺🇿',
  };

  private static readonly AWARD_ICONS: Record<string, string> = {
    GOLDEN_BOOT: '👟',
    GOLDEN_GLOVE: '🥊',
    PLAYER_OF_THE_TOURNAMENT: '⭐',
    PLAYER_OF_TOURNAMENT: '⭐',
    BEST_YOUNG_PLAYER: '🌟',
    TOP_ASSISTS: '🎯',
    FAIR_PLAY: '🤝',
  };

  getTeamFlag(teamId?: string | null): string {
    const normalizedTeamId = (teamId ?? '').trim().toLowerCase();
    return UiVisualsService.TEAM_FLAGS[normalizedTeamId] ?? '⚽';
  }

  getFinalChatMessageIcon(messageType?: string | null): string {
    const normalizedType = (messageType ?? '').trim().toUpperCase();

    switch (normalizedType) {
      case 'CONTEXT':
        return '⚽';
      case 'PLAYER_ACTION':
        return '🎯';
      case 'OPPONENT_REACTION':
        return '🛡️';
      case 'RESULT':
        return '🥅';
      case 'SUBSTITUTION':
        return '🔁';
      case 'INJURY':
        return '🤕';
      case 'YELLOW_CARD':
        return '🟨';
      case 'RED_CARD':
        return '🟥';
      case 'RESTART':
        return '🏁';
      case 'LAST_PLAY':
        return '⚡';
      case 'FINAL':
        return '🏆';
      case 'INFO':
        return 'ℹ️';
      default:
        return '💬';
    }
  }

  getLiveEventIcon(style?: string | null, eventType?: string | null): string {
    const normalizedStyle = (style ?? '').trim().toLowerCase();
    const normalizedEventType = (eventType ?? '').trim().toUpperCase();

    switch (normalizedStyle) {
      case 'goal':
        return '🥅';
      case 'yellow':
        return '🟨';
      case 'red':
        return '🟥';
      case 'sub':
        return '🔁';
      default:
        if (normalizedEventType.includes('KICKOFF')) {
          return '🏁';
        }

        if (normalizedEventType.includes('HALF_TIME')) {
          return '⏸️';
        }

        return '⚽';
    }
  }

  getAwardIcon(awardCode?: string | null): string {
    const normalizedCode = (awardCode ?? '').trim().toUpperCase();
    return UiVisualsService.AWARD_ICONS[normalizedCode] ?? '🏅';
  }

  getTeamHistorySectionIcon(sectionKey?: string | null): string {
    const normalizedKey = (sectionKey ?? '').trim().toLowerCase();

    if (normalizedKey === 'other-international-titles') {
      return '🏆';
    }

    if (normalizedKey.includes('world-cup')) {
      return '🌎';
    }

    return '🏅';
  }
}
