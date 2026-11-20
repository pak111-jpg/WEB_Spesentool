import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** NestJS-Modul: Datenbankzugriff mit Prisma. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
