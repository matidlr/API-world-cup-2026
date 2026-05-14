import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseBuilder } from './response.builder';
import { ErrorUtils } from '../shared/error/error.utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestInfo = ErrorUtils.buildRequestInfo(request);
    this.logger.error(ErrorUtils.buildLogMessage(exception, requestInfo));

    if (host.getType() !== 'http') {
      return;
    }

    const exceptionDetails = ErrorUtils.extractExceptionDetails(exception, httpStatus);
    const responseBody = exceptionDetails.messageCode
      ? new ResponseBuilder<any>().createFailureResponse(
          null,
          exceptionDetails.messageCode,
          exceptionDetails.message,
        )
      : new ResponseBuilder<any>().createFailureResponse(null, exceptionDetails.message);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
