import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

export interface ExceptionDetails {
  statusCode: number;
  messageCode?: string;
  message: string;
}

export class ErrorUtils {
  public static extractExceptionDetails(exception: unknown): ExceptionDetails {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode,
          message: response,
        };
      }

      if (response && typeof response === 'object') {
        const typedResponse = response as Record<string, unknown>;
        const messageCode =
          typeof typedResponse.messageCode === 'string' ? typedResponse.messageCode : undefined;
        const message =
          typeof typedResponse.message === 'string'
            ? typedResponse.message
            : exception.message || 'Unexpected error';

        return {
          statusCode,
          messageCode,
          message,
        };
      }

      return {
        statusCode,
        message: exception.message || 'Unexpected error',
      };
    }

    const axiosError = exception as AxiosError;
    if (axiosError?.isAxiosError) {
      const statusCode = axiosError.response?.status ?? HttpStatus.BAD_GATEWAY;
      const payload = axiosError.response?.data as Record<string, unknown> | undefined;
      const nestedMessage = payload?.responseMessage as Record<string, unknown> | undefined;
      const message =
        (typeof nestedMessage?.message === 'string' && nestedMessage.message) ||
        (typeof payload?.message === 'string' && payload.message) ||
        axiosError.message ||
        'External API error';
      const messageCode =
        (typeof nestedMessage?.messageCode === 'string' && nestedMessage.messageCode) ||
        undefined;

      return {
        statusCode,
        messageCode,
        message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception instanceof Error ? exception.message : 'Unexpected error',
    };
  }

  public static buildRequestInfo(request: unknown): string {
    if (!request || typeof request !== 'object') {
      return '';
    }

    const typedRequest = request as Record<string, unknown>;
    const method = typeof typedRequest.method === 'string' ? typedRequest.method : 'UNKNOWN';
    const url = typeof typedRequest.url === 'string' ? typedRequest.url : 'UNKNOWN';

    return `${method} ${url}`;
  }
}
