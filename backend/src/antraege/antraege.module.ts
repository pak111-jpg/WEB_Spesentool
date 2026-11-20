import { Module } from '@nestjs/common';
import { AntraegeController } from './antraege.controller';
import { AntraegeService } from './antraege.service';

/** NestJS-Modul: Spesenanträge der Mitarbeitenden. */
@Module({
  controllers: [AntraegeController],
  providers: [AntraegeService],
  exports: [AntraegeService],
})
export class AntraegeModule {}
