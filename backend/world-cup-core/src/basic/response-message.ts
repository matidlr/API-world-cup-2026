import { ApiProperty } from '@nestjs/swagger';

export class ResponseMessage {
  public static readonly DEFAULT_CODE = '0000';

  @ApiProperty()
  private readonly messageCode: string;

  @ApiProperty()
  private readonly message: string;

  constructor();
  constructor(message: string);
  constructor(messageCode: string, message: string);
  constructor(messageOrCode?: string, message?: string) {
    if (message !== undefined) {
      this.messageCode = messageOrCode || '';
      this.message = message;
      return;
    }

    this.messageCode = ResponseMessage.DEFAULT_CODE;
    this.message = messageOrCode || '';
  }

  public getMessageCode(): string {
    return this.messageCode;
  }

  public getMessage(): string {
    return this.message;
  }
}
