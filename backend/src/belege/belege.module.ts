import { Module } from '@nestjs/common';
import { BelegeController } from './belege.controller';
import { BelegeService } from './belege.service';

@Module({
  controllers: [BelegeController],
  providers: [BelegeService],
  exports: [BelegeService],
})
export class BelegeModule {}
