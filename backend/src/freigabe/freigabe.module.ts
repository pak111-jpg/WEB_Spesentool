import { Module } from '@nestjs/common';
import { FreigabeController } from './freigabe.controller';
import { FreigabeService } from './freigabe.service';

/** NestJS-Modul: Prüfen und Entscheiden durch Vorgesetzte. */
@Module({
  controllers: [FreigabeController],
  providers: [FreigabeService],
})
export class FreigabeModule {}
