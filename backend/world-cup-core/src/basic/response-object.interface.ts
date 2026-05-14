/**
 * Wrapper estándar para todas las respuestas del BFF.
 * Replica el patrón ResponseObject<T> de la WorldCupAPI.
 */
export interface ResponseObject<T> {
  serverTime: string;
  success: boolean;
  responseMessage: string;
  data: T;
}
