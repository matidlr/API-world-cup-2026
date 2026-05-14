import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiErrorCode,
  isApiErrorCode,
  resolveApiErrorMessage,
} from './api-error-code.enum';

export interface ExceptionDetails {
  message: string;
  messageCode?: ApiErrorCode;
}

export class ErrorUtils {
  static buildRequestInfo(request: any): string {
    return request
      ? `${request.method} ${request.url} - Body: ${JSON.stringify(request.body || {})}`
      : 'No request context available';
  }

  static buildLogMessage(exception: any, requestInfo: string): string {
    return `Error: ${exception?.message || 'Unknown error'} | Request: ${requestInfo} | Stack: ${exception?.stack || 'No stack'}`;
  }

  static extractExceptionDetails(exception: any, httpStatus: number): ExceptionDetails {
    if (!(exception instanceof HttpException)) {
      return {
        message: resolveApiErrorMessage(ApiErrorCode.INTERNAL_SERVER_ERROR),
        messageCode: ApiErrorCode.INTERNAL_SERVER_ERROR,
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      if (isApiErrorCode(response)) {
        return {
          message: resolveApiErrorMessage(response),
          messageCode: response,
        };
      }

      return {
        message: response,
        messageCode: httpStatus >= 500 ? ApiErrorCode.INTERNAL_SERVER_ERROR : undefined,
      };
    }

    if (response && typeof response === 'object') {
      const responseData = response as Record<string, unknown>;
      const responseMessageObject =
        responseData['responseMessage'] && typeof responseData['responseMessage'] === 'object'
          ? (responseData['responseMessage'] as Record<string, unknown>)
          : null;

      const responseMessageCodeValue = responseMessageObject?.['messageCode'];
      const responseMessageValue = responseMessageObject?.['message'];

      if (typeof responseMessageCodeValue === 'string' && isApiErrorCode(responseMessageCodeValue)) {
        return {
          message: resolveApiErrorMessage(responseMessageCodeValue),
          messageCode: responseMessageCodeValue,
        };
      }

      if (typeof responseMessageValue === 'string') {
        return {
          message: responseMessageValue,
        };
      }

      const messageValue = responseData['message'];

      if (Array.isArray(messageValue) && messageValue.length > 0) {
        const firstMessage = messageValue.find((item) => typeof item === 'string') as
          | string
          | undefined;

        if (firstMessage) {
          if (isApiErrorCode(firstMessage)) {
            return {
              message: resolveApiErrorMessage(firstMessage),
              messageCode: firstMessage,
            };
          }

          return {
            message: firstMessage,
            messageCode: ApiErrorCode.VALIDATION_ERROR,
          };
        }

        return {
          message: resolveApiErrorMessage(ApiErrorCode.VALIDATION_ERROR),
          messageCode: ApiErrorCode.VALIDATION_ERROR,
        };
      }

      if (typeof messageValue === 'string') {
        if (isApiErrorCode(messageValue)) {
          return {
            message: resolveApiErrorMessage(messageValue),
            messageCode: messageValue,
          };
        }

        return {
          message: messageValue,
          messageCode: httpStatus === HttpStatus.BAD_REQUEST ? ApiErrorCode.BAD_REQUEST : undefined,
        };
      }
    }

    if (httpStatus >= 500) {
      return {
        message: resolveApiErrorMessage(ApiErrorCode.INTERNAL_SERVER_ERROR),
        messageCode: ApiErrorCode.INTERNAL_SERVER_ERROR,
      };
    }

    if (httpStatus === HttpStatus.BAD_REQUEST) {
      return {
        message: resolveApiErrorMessage(ApiErrorCode.BAD_REQUEST),
        messageCode: ApiErrorCode.BAD_REQUEST,
      };
    }

    return {
      message: exception?.message || resolveApiErrorMessage(ApiErrorCode.INTERNAL_SERVER_ERROR),
    };
  }
}
