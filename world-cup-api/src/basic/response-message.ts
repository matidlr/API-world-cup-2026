import { ApiProperty } from '@nestjs/swagger';

export class ResponseMessage {
  public static readonly MESSAGE_CODE_DEFAULT = '0000';

  @ApiProperty()
  private messageCode: string;

  @ApiProperty()
  private message: string;

  constructor();
  constructor(message: string);
  constructor(messageCode: string, message: string);
  constructor(messageOrMessageCode?: string, message?: string) {
    if (message !== undefined) {
      this.messageCode = messageOrMessageCode || '';
      this.message = message;
    } else {
      this.messageCode = ResponseMessage.MESSAGE_CODE_DEFAULT;
      this.message = messageOrMessageCode || '';
    }
  }

  public getMessageCode(): string {
    return this.messageCode;
  }

  public getMessage(): string {
    return this.message;
  }
}
