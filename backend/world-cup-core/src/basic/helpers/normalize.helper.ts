import { LanguageEnum } from '../model/language.enum';

/** Normalizes an optional language value with fallback to provided language or default. */
export function normalizeLanguage(
  lang?: string,
  fallbackLanguage: LanguageEnum = LanguageEnum.DEFAULT,
): LanguageEnum {
  switch (lang?.toLowerCase()) {
    case LanguageEnum.EN:
      return LanguageEnum.EN;
    case LanguageEnum.ES:
      return LanguageEnum.ES;
    default:
      return fallbackLanguage;
  }
}

/** Converts numeric values into non-negative integers. */
export function normalizeNonNegativeNumber(value?: number | null): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

/** Converts numeric values into signed integers. */
export function normalizeSignedNumber(value?: number | null): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.trunc(value);
}

/** Converts numeric values into nullable integers for score-like fields. */
export function normalizeNullableNumber(value?: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.trunc(value);
}

/** Converts numeric values into fixed decimals. */
export function normalizeDecimal(value?: number, digits = 2): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(digits));
}

/** Normalizes player energy into range 0..100. */
export function normalizeEnergy(value?: number): number {
  return Math.max(0, Math.min(100, normalizeNonNegativeNumber(value)));
}

/** Normalizes action ids into uppercase underscore format. */
export function normalizeActionId(value?: string): string {
  if (!value?.trim()) {
    return '';
  }

  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

/** Normalizes text for accent-insensitive comparisons. */
export function normalizeText(value?: string): string {
  if (!value?.trim()) {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Normalizes a free-form search term for case-insensitive matching. */
export function normalizeSearchTerm(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

/** Normalizes team ids into lowercase and optionally returns null when empty. */
export function normalizeTeamId(
  teamId?: string | null,
  allowNull = false,
): string | null {
  const normalizedTeamId = (teamId ?? '').trim().toLowerCase();
  if (!normalizedTeamId) {
    return allowNull ? null : '';
  }

  return normalizedTeamId;
}

/** Removes blank entries and trims each string element. */
export function normalizeStringArray(values?: string[]): string[] {
  return (Array.isArray(values) ? values : [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

/** Resolves count from explicit value, then fallback size, then default one. */
export function normalizeCount(count?: number, fallbackCount = 0): number {
  if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
    return Math.floor(count);
  }

  if (fallbackCount > 0) {
    return fallbackCount;
  }

  return 1;
}
