import { ConfigService } from '@nestjs/config';
import { I18nService } from 'src/i18n/i18n.service';
import { MatchAction } from '../model/match-action.enum';
import { MatchLanguage } from '../model/match-language.model';
import { MatchRuntimeConfigHelper } from './match-runtime-config.helper';
import { AbstractMatchBasicHelper } from './abstract-match-basic.helper';

export abstract class AbstractMatchI18nHelper extends AbstractMatchBasicHelper {
  protected resolveLanguage(
    language: string | MatchLanguage | undefined,
    matchRuntimeConfigHelper: MatchRuntimeConfigHelper,
  ): MatchLanguage {
    return matchRuntimeConfigHelper.resolveLanguage(language);
  }

  protected actionLabel(
    action: MatchAction,
    language: MatchLanguage,
    i18nService: I18nService,
    configService?: ConfigService,
    fallback?: string,
  ): string {
    if (configService && language === 'en') {
      const envLabel = configService.get<string>(`MATCH_LABEL_${action}`);
      if (envLabel && envLabel.trim().length > 0) {
        return envLabel.trim();
      }
    }

    return i18nService.t(`match.action.${action}`, language) || fallback || action;
  }
}
