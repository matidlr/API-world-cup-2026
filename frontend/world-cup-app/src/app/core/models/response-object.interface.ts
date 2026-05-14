/**
 * Wrapper estándar de respuesta del BFF/WorldCupAPI.
 */
export interface ResponseObject<T> {
  serverTime: string;
  success: boolean;
  responseMessage: string;
  data: T;
}
