import { ResponseMessage } from './response-message';
import { ResponseObject } from './response-object';

export class ResponseBuilder<T> {
  public static readonly DEFAULT_OK_MSG = 'OK';
  public static readonly DEFAULT_ERROR_MSG = 'ERROR';

  public responseMessage: ResponseMessage;
  public data: T;
  public serverResponseTime: Date;
  public success = true;

  public createSuccessResponse(data?: T, message?: string): ResponseObject<T> {
    this.responseMessage = message ? new ResponseMessage(message) : this.getDefaultMessage();
    this.serverResponseTime = new Date();
    this.data = data || null;
    this.success = true;

    return new ResponseObject<T>(this);
  }

  public createFailureResponse(data?: T, messageOrMessageCode?: string, message?: string): ResponseObject<T> {
    if (message && messageOrMessageCode) {
      this.responseMessage = new ResponseMessage(messageOrMessageCode, message);
    } else if (messageOrMessageCode) {
      this.responseMessage = new ResponseMessage(messageOrMessageCode);
    } else {
      this.responseMessage = this.getDefaultErrorMessage();
    }

    this.serverResponseTime = new Date();
    this.data = data || null;
    this.success = false;

    return new ResponseObject<T>(this);
  }

  private getDefaultMessage(): ResponseMessage {
    return new ResponseMessage(ResponseBuilder.DEFAULT_OK_MSG);
  }

  private getDefaultErrorMessage(): ResponseMessage {
    return new ResponseMessage(ResponseBuilder.DEFAULT_ERROR_MSG);
  }
}
