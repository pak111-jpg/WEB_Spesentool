import { Module } from '@nestjs/common';
import { LohnbuchhaltungController } from './lohnbuchhaltung.controller';
import { LohnbuchhaltungService } from './lohnbuchhaltung.service';

/** NestJS-Modul: Export, Auszahlung und Auswertung der Lohnbuchhaltung. */
@Module({
  controllers: [LohnbuchhaltungController],
  providers: [LohnbuchhaltungService],
})
export class LohnbuchhaltungModule {}
