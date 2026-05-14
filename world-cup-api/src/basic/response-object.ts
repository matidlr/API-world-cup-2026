import { ApiProperty } from '@nestjs/swagger';
import { GenericResponse } from './generic-response.interface';
import { ResponseBuilder } from './response.builder';
import { ResponseMessage } from './response-message';

export class ResponseObject<T> implements GenericResponse {
  @ApiProperty()
  protected serverTime: Date;

  @ApiProperty()
  protected success: boolean;

  @ApiProperty()
  protected responseMessage: ResponseMessage;

  @ApiProperty()
  protected data: T;

  constructor(responseBuilderObject?: ResponseBuilder<T>) {
    if (responseBuilderObject) {
      this.serverTime = responseBuilderObject.serverResponseTime;
      this.data = responseBuilderObject.data;
      this.responseMessage = responseBuilderObject.responseMessage;
      this.success = responseBuilderObject.success;
    }
  }

  public getData(): T {
    return this.data;
  }

  public getServerTime(): Date {
    return this.serverTime;
  }

  public isSuccess(): boolean {
    return this.success;
  }
}
