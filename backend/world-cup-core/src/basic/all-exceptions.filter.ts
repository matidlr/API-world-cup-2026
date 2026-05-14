import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorUtils } from './error/error.utils';
import { ResponseBuilder } from './response.builder';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    if (host.getType() !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const details = ErrorUtils.extractExceptionDetails(exception);
    const requestInfo = ErrorUtils.buildRequestInfo(request);

    this.logger.error(
      `${details.statusCode} ${requestInfo} - ${details.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody = details.messageCode
      ? new ResponseBuilder<any>().createFailureResponse(null, details.messageCode, details.message)
      : new ResponseBuilder<any>().createFailureResponse(null, details.message);

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : details.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}
