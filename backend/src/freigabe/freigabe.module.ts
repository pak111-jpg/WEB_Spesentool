import { Module } from '@nestjs/common';
import { FreigabeController } from './freigabe.controller';
import { FreigabeService } from './freigabe.service';

@Module({
  controllers: [FreigabeController],
  providers: [FreigabeService],
})
export class FreigabeModule {}
