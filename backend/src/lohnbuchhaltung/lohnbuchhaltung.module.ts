import { Module } from '@nestjs/common';
import { LohnbuchhaltungController } from './lohnbuchhaltung.controller';
import { LohnbuchhaltungService } from './lohnbuchhaltung.service';

@Module({
  controllers: [LohnbuchhaltungController],
  providers: [LohnbuchhaltungService],
})
export class LohnbuchhaltungModule {}
