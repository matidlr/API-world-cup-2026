import { Injectable } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchEntity } from '../entity/match.entity';
import { MatchFinalMessageHelperContract } from '../interfaces/match-final-message.interface';
import { MatchLanguage } from '../model/match-language.model';
import { FINAL_WHISTLE_VARIANT_COUNT } from '../model/match-engine.constants';

@Injectable()
/**
 * Builds stable localized final-whistle messages.
 */
export class MatchFinalMessageHelper implements MatchFinalMessageHelperContract {
  constructor(private readonly i18nService: I18nService) {}

  buildFinalMessageLocalized(match: MatchEntity, language: MatchLanguage): string {
    const userWon = match.scoreTeam > match.scoreOpponent;
    const variantIndex = this.resolveFinalWhistleVariantIndex(match, userWon);
    const variantKey = userWon
      ? `match.final.userWins.variant.${variantIndex}`
      : `match.final.opponentWins.variant.${variantIndex}`;

    return this.i18nService.t(variantKey, language, {
      teamName: match.teamName,
      opponentName: match.opponentName,
      scoreTeam: match.scoreTeam,
      scoreOpponent: match.scoreOpponent,
      teamCaptainName: match.teamCaptainName || match.teamName,
      teamCoachName: match.teamCoachName || match.teamName,
      opponentCaptainName: match.opponentCaptainName || match.opponentName,
      opponentCoachName: match.opponentCoachName || match.opponentName,
    });
  }

  private resolveFinalWhistleVariantIndex(match: MatchEntity, userWon: boolean): number {
    const seed = `${match.matchId}|${match.turn}|${match.scoreTeam}|${match.scoreOpponent}|${userWon ? 'W' : 'L'}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }

    return (hash % FINAL_WHISTLE_VARIANT_COUNT) + 1;
  }
}
