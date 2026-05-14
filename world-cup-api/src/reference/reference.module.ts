import { Module } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';

@Module({
  controllers: [ReferenceController],
  providers: [ReferenceService, I18nService],
})
/**
 * Reference module exposing educational catalogs for consumers of the API.
 */
export class ReferenceModule {}
