import { ResponseMessage } from './response-message';
import { ResponseObject } from './response-object';

export class ResponseBuilder<T> {
  public static readonly DEFAULT_OK_MESSAGE = 'OK';
  public static readonly DEFAULT_ERROR_MESSAGE = 'ERROR';

  public responseMessage: ResponseMessage;
  public data: T;
  public serverResponseTime: Date;
  public success = true;

  public createSuccessResponse(data?: T, message?: string): ResponseObject<T> {
    this.responseMessage = message
      ? new ResponseMessage(message)
      : new ResponseMessage(ResponseBuilder.DEFAULT_OK_MESSAGE);
    this.data = (data ?? null) as T;
    this.serverResponseTime = new Date();
    this.success = true;

    return new ResponseObject<T>(this);
  }

  public createFailureResponse(
    data?: T,
    messageCodeOrMessage?: string,
    message?: string,
  ): ResponseObject<T> {
    if (messageCodeOrMessage && message !== undefined) {
      this.responseMessage = new ResponseMessage(messageCodeOrMessage, message);
    } else if (messageCodeOrMessage) {
      this.responseMessage = new ResponseMessage(messageCodeOrMessage);
    } else {
      this.responseMessage = new ResponseMessage(ResponseBuilder.DEFAULT_ERROR_MESSAGE);
    }

    this.data = (data ?? null) as T;
    this.serverResponseTime = new Date();
    this.success = false;

    return new ResponseObject<T>(this);
  }
}
