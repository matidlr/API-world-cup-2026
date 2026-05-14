import { v4 as uuidv4 } from 'uuid';
import { ResponseBuilder } from './response.builder';
import { ResponseObject } from './response-object';

export abstract class AbstractController {
  public createOkResponse<T>(object: T): ResponseObject<T> {
    return new ResponseBuilder<T>().createSuccessResponse(object);
  }

  public createOkResponseWithMessage<T>(object: T, message: string): ResponseObject<T> {
    return new ResponseBuilder<T>().createSuccessResponse(object, message);
  }

  public createFailureResponse<T>(object: T, message: string): ResponseObject<T> {
    return new ResponseBuilder<T>().createFailureResponse(object, message);
  }

  protected createRandomId(placeholder: string): string {
    return placeholder + uuidv4();
  }
}
