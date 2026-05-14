import { v4 as uuidv4 } from 'uuid';
import { ResponseBuilder } from './response.builder';
import { ResponseObject } from './response-object';

export abstract class AbstractController {
  protected createOkResponse<T>(data: T): ResponseObject<T> {
    return new ResponseBuilder<T>().createSuccessResponse(data);
  }

  protected createOkResponseWithMessage<T>(data: T, message: string): ResponseObject<T> {
    return new ResponseBuilder<T>().createSuccessResponse(data, message);
  }

  protected createFailureResponse<T>(data: T, message: string): ResponseObject<T> {
    return new ResponseBuilder<T>().createFailureResponse(data, message);
  }

  protected createRandomId(prefix: string): string {
    return `${prefix}${uuidv4()}`;
  }
}
