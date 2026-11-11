import { Module } from '@nestjs/common';
import { AntraegeModule } from '../antraege/antraege.module';
import { BelegeModule } from '../belege/belege.module';
import { PositionenController } from './positionen.controller';
import { PositionenService } from './positionen.service';

@Module({
  imports: [AntraegeModule, BelegeModule],
  controllers: [PositionenController],
  providers: [PositionenService],
  exports: [PositionenService],
})
export class PositionenModule {}
