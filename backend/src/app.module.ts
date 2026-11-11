import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AntraegeModule } from './antraege/antraege.module';
import { AuthModule } from './auth/auth.module';
import { BelegeModule } from './belege/belege.module';
import { FreigabeModule } from './freigabe/freigabe.module';
import { LohnbuchhaltungModule } from './lohnbuchhaltung/lohnbuchhaltung.module';
import { PositionenModule } from './positionen/positionen.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AntraegeModule,
    PositionenModule,
    BelegeModule,
    FreigabeModule,
    LohnbuchhaltungModule,
  ],
})
export class AppModule {}
