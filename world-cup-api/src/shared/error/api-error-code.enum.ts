export enum ApiErrorCode {
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  ACTIVE_FINAL_NOT_FOUND = 'ACTIVE_FINAL_NOT_FOUND',
  WORLD_CUP_NOT_FOUND = 'WORLD_CUP_NOT_FOUND',
  WORLD_CUP_FINAL_ACTIVE = 'WORLD_CUP_FINAL_ACTIVE',
  WORLD_CUP_NOT_ENDED = 'WORLD_CUP_NOT_ENDED',
  INVALID_SELECTED_OPTION = 'INVALID_SELECTED_OPTION',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.TEAM_NOT_FOUND]: 'Team was not found',
  [ApiErrorCode.MATCH_NOT_FOUND]: 'Match was not found',
  [ApiErrorCode.ACTIVE_FINAL_NOT_FOUND]: 'There is no active final',
  [ApiErrorCode.WORLD_CUP_NOT_FOUND]: 'World cup was not found',
  [ApiErrorCode.WORLD_CUP_FINAL_ACTIVE]: 'There is already an active final for the current world cup',
  [ApiErrorCode.WORLD_CUP_NOT_ENDED]: 'World cup has not ended yet',
  [ApiErrorCode.INVALID_SELECTED_OPTION]: 'Selected option is invalid for this turn',
  [ApiErrorCode.VALIDATION_ERROR]: 'Request validation failed',
  [ApiErrorCode.BAD_REQUEST]: 'Bad request',
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
};

export function isApiErrorCode(value: string): value is ApiErrorCode {
  return Object.values(ApiErrorCode).includes(value as ApiErrorCode);
}

export function resolveApiErrorMessage(errorCode: ApiErrorCode): string {
  return API_ERROR_MESSAGES[errorCode];
}
