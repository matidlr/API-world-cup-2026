import { HttpStatus, Injectable } from '@nestjs/common';
import { AdminService } from '../../admin/admin.service';
import { AbstractBaseService } from '../../basic/abstract-base.service';
import { ApiErrorMappingRule, ApiErrorStatusMap, ErrorUtils } from '../../basic/error/error.utils';
import { normalizeCount, normalizeStringArray } from '../../basic/helpers/normalize.helper';
import { LanguageEnum } from '../../basic/model/language.enum';
import { WorldCupCoreErrorCode } from '../../basic/model/world-cup-core-error-code.enum';
import { WorldCupFeatureApiService } from '../../basic/world-cup-feature-api.service';
import {
  TeamHistoryApiResponse,
  TeamHistoryApiTitleAchievement,
} from './model/team-history-service.interface';
import {
  TeamHistoryScreenModel,
  TeamHistorySectionModel,
  TeamHistoryTitleItemModel,
} from './model/team-history-service.model';

const TEAM_HISTORY_API_ERROR_STATUS_MAP: ApiErrorStatusMap = {
  [HttpStatus.NOT_FOUND]: {
    messageCode: WorldCupCoreErrorCode.WC_TEAM_HISTORY_UNAVAILABLE,
    message: 'Team history for the selected team was not found.',
  },
  [HttpStatus.CONFLICT]: {
    messageCode: WorldCupCoreErrorCode.WC_TEAM_HISTORY_UNAVAILABLE,
    message: 'Team history is not available right now. Try again in a moment.',
  },
};

const TEAM_HISTORY_API_ERROR_FALLBACK: ApiErrorMappingRule = {
  messageCode: WorldCupCoreErrorCode.WC_TEAM_HISTORY_UNAVAILABLE,
  message: 'Unable to load team history from World Cup API.',
  statusCode: HttpStatus.BAD_GATEWAY,
};

@Injectable()
export class TeamHistoryService extends AbstractBaseService {
  /** Handles team history business flow for My Team section. */
  constructor(
    private readonly worldCupFeatureApiService: WorldCupFeatureApiService,
    adminService: AdminService,
  ) {
    super(adminService);
  }

  /** Returns title history for the currently selected team. */
  public async getHistory(lang?: string): Promise<TeamHistoryScreenModel> {
    try {
      const teamId = this.getCurrentTeamId();
      const resolvedLang = this.resolveLang(lang);
      const history: TeamHistoryApiResponse = await this.worldCupFeatureApiService.getTeamHistory(
        teamId,
        resolvedLang,
      );
      const titles = this.mapAndSortTitles(history?.titles ?? []);
      const sections = this.buildSections(titles, resolvedLang);

      return new TeamHistoryScreenModel({
        teamId,
        totalTitles: titles.reduce((accumulator, currentTitle) => accumulator + currentTitle.count, 0),
        totalCompetitions: titles.length,
        organizations: this.extractOrganizations(titles),
        titles,
        sections,
      });
    } catch (error) {
      ErrorUtils.mapWorldCupApiError(
        error,
        TEAM_HISTORY_API_ERROR_STATUS_MAP,
        TEAM_HISTORY_API_ERROR_FALLBACK,
      );
    }
  }

  /** Maps API title payload into a stable screen-friendly structure and sorting. */
  private mapAndSortTitles(
    apiTitles: Array<string | TeamHistoryApiTitleAchievement>,
  ): TeamHistoryTitleItemModel[] {
    return apiTitles
      .map((rawTitle) => this.mapTitle(rawTitle))
      .filter((title) => title.tournament.length > 0)
      .sort((leftTitle, rightTitle) => {
        if (leftTitle.count !== rightTitle.count) {
          return rightTitle.count - leftTitle.count;
        }

        if (leftTitle.org !== rightTitle.org) {
          return leftTitle.org.localeCompare(rightTitle.org);
        }

        return leftTitle.tournament.localeCompare(rightTitle.tournament);
      });
  }

  /** Normalizes either legacy string titles or detailed title objects from World Cup API. */
  private mapTitle(rawTitle: string | TeamHistoryApiTitleAchievement): TeamHistoryTitleItemModel {
    if (typeof rawTitle === 'string') {
      const tournament = rawTitle.trim();

      return new TeamHistoryTitleItemModel({
        org: 'N/A',
        tournament,
        count: tournament ? 1 : 0,
        years: [],
        hosts: [],
        label: tournament,
      });
    }

    const org = rawTitle?.org?.trim() || 'N/A';
    const tournament = rawTitle?.tournament?.trim() || '';
    const years = normalizeStringArray(rawTitle?.years);
    const hosts = normalizeStringArray(rawTitle?.hosts);
    const count = normalizeCount(rawTitle?.count, years.length);

    return new TeamHistoryTitleItemModel({
      org,
      tournament,
      count,
      years,
      hosts,
      label: org === 'N/A' ? tournament : `${org} ${tournament}`.trim(),
    });
  }

  /** Builds UI sections in the same structure expected by the mock design. */
  private buildSections(
    titles: TeamHistoryTitleItemModel[],
    lang: LanguageEnum,
  ): TeamHistorySectionModel[] {
    const worldCupSections = titles
      .filter((title) => this.isWorldCupTitle(title))
      .map((title) => this.buildDedicatedSection(title));

    const dedicatedSections = titles
      .filter((title) => !this.isWorldCupTitle(title) && this.shouldHaveDedicatedSection(title))
      .map((title) => this.buildDedicatedSection(title));

    const otherTitles = titles.filter(
      (title) => !this.isWorldCupTitle(title) && !this.shouldHaveDedicatedSection(title),
    );
    const otherSection = this.buildOtherTitlesSection(otherTitles, lang);

    return [...worldCupSections, ...dedicatedSections, ...(otherSection ? [otherSection] : [])];
  }

  /** Builds a section for one dedicated competition (World Cup, Copa América, Euro, etc). */
  private buildDedicatedSection(
    title: TeamHistoryTitleItemModel,
  ): TeamHistorySectionModel {
    return new TeamHistorySectionModel({
      key: this.toSectionKey(title.label),
      title: title.label,
      count: title.count,
      chips: this.buildDedicatedChips(title),
    });
  }

  /** Builds the "Other International Titles" section that aggregates single-title competitions. */
  private buildOtherTitlesSection(
    titles: TeamHistoryTitleItemModel[],
    lang: LanguageEnum,
  ): TeamHistorySectionModel | null {
    if (titles.length === 0) {
      return null;
    }

    const chips = titles.flatMap((title) => this.buildOtherChips(title));
    const count = titles.reduce((accumulator, title) => accumulator + title.count, 0);

    return new TeamHistorySectionModel({
      key: 'other-international-titles',
      title: this.getOtherInternationalTitlesLabel(lang),
      count,
      chips,
    });
  }


  private getOtherInternationalTitlesLabel(lang: LanguageEnum): string {
    return lang === LanguageEnum.ES ? 'Otros titulos internacionales' : 'Other International Titles';
  }

  /** Builds chips for dedicated sections using year + host where available. */
  private buildDedicatedChips(title: TeamHistoryTitleItemModel): string[] {
    if (title.years.length === 0) {
      return [title.tournament];
    }

    return title.years.map((year, index) => {
      const host = title.hosts[index];
      return host ? `${year} · ${host}` : year;
    });
  }

  /** Builds chips for aggregated "Other Titles" using year + tournament label. */
  private buildOtherChips(title: TeamHistoryTitleItemModel): string[] {
    if (title.years.length === 0) {
      return [title.tournament];
    }

    return title.years.map((year) => `${year} · ${title.tournament}`);
  }

  /** Determines whether a competition should have its own card section. */
  private shouldHaveDedicatedSection(title: TeamHistoryTitleItemModel): boolean {
    return title.count > 1 || title.years.length > 1;
  }

  /** Identifies FIFA World Cup titles. */
  private isWorldCupTitle(title: TeamHistoryTitleItemModel): boolean {
    const normalizedLabel = title.label.toLowerCase();
    const normalizedTournament = title.tournament.toLowerCase();
    return normalizedLabel.includes('world cup') || normalizedTournament.includes('world cup');
  }

  /** Converts section labels to stable keys for frontend tracking. */
  private toSectionKey(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /** Returns unique organization names sorted alphabetically (excluding N/A). */
  private extractOrganizations(titles: TeamHistoryTitleItemModel[]): string[] {
    const organizations = titles
      .map((title) => title.org)
      .filter((organization) => organization !== 'N/A');

    return [...new Set(organizations)].sort((leftOrganization, rightOrganization) =>
      leftOrganization.localeCompare(rightOrganization),
    );
  }
}
