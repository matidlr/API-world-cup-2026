import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AbstractBasicChatEntity {
  @CreateDateColumn({
    type: 'datetime',
    update: false,
  })
  creationDate: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  lastUpdate: Date;
}
