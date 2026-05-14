import { ApiProperty } from '@nestjs/swagger';
import { GenericResponse } from './generic-response.interface';
import { ResponseBuilder } from './response.builder';
import { ResponseMessage } from './response-message';

export class ResponseObject<T> implements GenericResponse {
  @ApiProperty()
  private readonly serverTime: Date;

  @ApiProperty()
  private readonly success: boolean;

  @ApiProperty({ type: ResponseMessage })
  private readonly responseMessage: ResponseMessage;

  @ApiProperty()
  private readonly data: T;

  constructor(responseBuilder?: ResponseBuilder<T>) {
    if (!responseBuilder) {
      this.serverTime = new Date();
      this.success = true;
      this.responseMessage = new ResponseMessage('OK');
      this.data = null as T;
      return;
    }

    this.serverTime = responseBuilder.serverResponseTime;
    this.success = responseBuilder.success;
    this.responseMessage = responseBuilder.responseMessage;
    this.data = responseBuilder.data;
  }

  public getServerTime(): Date {
    return this.serverTime;
  }

  public isSuccess(): boolean {
    return this.success;
  }

  public getData(): T {
    return this.data;
  }
}
