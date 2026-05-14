import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeLanguage, normalizeTeamId } from '../basic/helpers/normalize.helper';
import { LanguageEnum } from '../basic/model/language.enum';
import { WorldCupApiService } from '../basic/world-cup-api.service';
import { getTeamTheme, TeamTheme } from './team-themes.config';

interface WorldCupResponse<T> {
  data: T;
}

@Injectable()
export class AdminService {
  /** Stores and manages runtime teacher-mode configuration (team/language/theme). */
  private currentTeamId: string;
  private currentLang: LanguageEnum;

  /** Initializes admin runtime state from environment defaults. */
  constructor(
    private readonly configService: ConfigService,
    private readonly worldCupApiService: WorldCupApiService,
  ) {
    this.currentTeamId = this.configService.get<string>('TEAM_ID', 'arg').toLowerCase();
    this.currentLang = normalizeLanguage(this.configService.get<string>('APP_LANG', LanguageEnum.DEFAULT));
  }

  /** Returns currently selected team id. */
  public getCurrentTeamId(): string {
    return this.currentTeamId;
  }

  /** Returns currently selected language. */
  public getCurrentLang(): LanguageEnum {
    return this.currentLang;
  }

  /** Validates and updates selected team id. */
  public async setCurrentTeamId(teamId: string): Promise<void> {
    const normalizedTeamId = this.getValidatedTeamId(teamId);
    await this.ensureTeamExists(normalizedTeamId);
    this.currentTeamId = normalizedTeamId;
  }

  /** Updates selected language after normalization. */
  public setCurrentLang(lang: string): void {
    this.currentLang = normalizeLanguage(lang, LanguageEnum.DEFAULT);
  }

  /** Applies optional team/lang updates in one request and returns resulting config. */
  public async applyConfig(body: { teamId?: string; lang?: string }): Promise<{
    teamId: string;
    lang: LanguageEnum;
    theme: TeamTheme;
  }> {
    if (body.teamId !== undefined) {
      if (typeof body.teamId !== 'string') {
        throw new BadRequestException({
          messageCode: 'ADMIN_TEAM_ID_INVALID',
          message: 'teamId must be a string.',
        });
      }

      await this.setCurrentTeamId(body.teamId);
    }

    if (body.lang !== undefined) {
      if (typeof body.lang !== 'string') {
        throw new BadRequestException({
          messageCode: 'ADMIN_LANG_INVALID',
          message: 'lang must be a string.',
        });
      }

      this.setCurrentLang(body.lang);
    }

    return this.getCurrentConfig();
  }

  /** Returns the visual theme associated with the current team. */
  public getCurrentTheme(): TeamTheme {
    return getTeamTheme(this.currentTeamId);
  }

  /** Returns the full current admin config snapshot. */
  public getCurrentConfig(): { teamId: string; lang: LanguageEnum; theme: TeamTheme } {
    return {
      teamId: this.currentTeamId,
      lang: this.currentLang,
      theme: this.getCurrentTheme(),
    };
  }

  /** Returns selected team details together with active theme and language. */
  public async getCurrentTeamInfo(): Promise<{ team: unknown; theme: TeamTheme; lang: LanguageEnum }> {
    const team = await this.findTeamById(this.currentTeamId);
    if (!team) {
      throw new NotFoundException({
        messageCode: 'ADMIN_TEAM_NOT_FOUND',
        message: `Team '${this.currentTeamId}' was not found.`,
      });
    }

    return {
      team,
      theme: this.getCurrentTheme(),
      lang: this.currentLang,
    };
  }

  /** Returns all teams from World Cup API. */
  public async getAllTeams(): Promise<unknown[]> {
    const response = await this.worldCupApiService.get<WorldCupResponse<unknown[]>>('/teams');
    return response.data ?? [];
  }

  /** Validates and returns normalized team id input. */
  private getValidatedTeamId(teamId: string): string {
    const normalizedId = normalizeTeamId(teamId);
    if (!normalizedId) {
      throw new BadRequestException({
        messageCode: 'ADMIN_TEAM_ID_REQUIRED',
        message: 'teamId is required.',
      });
    }

    return normalizedId;
  }

  /** Ensures a team id exists in World Cup API before persisting it in config. */
  private async ensureTeamExists(teamId: string): Promise<void> {
    const team = await this.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException({
        messageCode: 'ADMIN_TEAM_NOT_FOUND',
        message: `Team '${teamId}' was not found.`,
      });
    }
  }

  /** Queries World Cup API for a team by id and returns first result if found. */
  private async findTeamById(teamId: string): Promise<unknown | null> {
    const response = await this.worldCupApiService.get<WorldCupResponse<unknown[]>>('/teams', {
      teamId,
    });
    const teams = Array.isArray(response?.data) ? response.data : [];
    return teams[0] ?? null;
  }

}
