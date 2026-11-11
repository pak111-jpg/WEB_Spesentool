import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { toBelegDto } from '../antraege/antraege.mapper';
import { BEARBEITBARE_STATUS } from '../antraege/antraege.service';
import { BelegDto } from '../antraege/dto/antrag.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export const ERLAUBTE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];
export const MAX_BELEG_BYTES = 10 * 1024 * 1024;

export interface HochgeladeneDatei {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class BelegeService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadDir = resolve(config.get('UPLOAD_DIR', 'uploads'));
  }

  /** MA-1: Beleg (Foto/PDF) zu einer Position hochladen; ein bestehender Beleg wird ersetzt. */
  async hochladen(
    userId: number,
    positionId: number,
    datei: HochgeladeneDatei | undefined,
  ): Promise<BelegDto> {
    if (!datei) {
      throw new BadRequestException('Keine Datei im Feld "datei" mitgeschickt');
    }
    if (!ERLAUBTE_MIME_TYPES.includes(datei.mimetype)) {
      throw new BadRequestException(
        `Dateityp ${datei.mimetype} nicht erlaubt (${ERLAUBTE_MIME_TYPES.join(', ')})`,
      );
    }

    const position = await this.prisma.position.findFirst({
      where: { id: positionId, antrag: { mitarbeitendeId: userId } },
      include: { beleg: true, antrag: true },
    });
    if (!position) {
      throw new NotFoundException(`Position ${positionId} nicht gefunden`);
    }
    if (!BEARBEITBARE_STATUS.includes(position.antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${position.antrag.status} kann nicht bearbeitet werden`,
      );
    }

    await mkdir(this.uploadDir, { recursive: true });
    const pfad = `${randomUUID()}${extname(datei.originalname).toLowerCase()}`;
    await writeFile(join(this.uploadDir, pfad), datei.buffer);

    if (position.beleg) {
      await this.dateiLoeschen(position.beleg.pfad);
    }

    const daten = {
      dateiname: datei.originalname,
      mimeType: datei.mimetype,
      groesse: datei.size,
      pfad,
    };
    const beleg = await this.prisma.beleg.upsert({
      where: { positionId },
      create: { positionId, ...daten },
      update: daten,
    });
    return toBelegDto(beleg);
  }

  /**
   * LB-2 / VG-2: Beleg abrufen. Erlaubt für die Person selbst, ihre vorgesetzte Person
   * und die Lohnbuchhaltung.
   */
  async herunterladen(
    user: AuthUser,
    belegId: number,
  ): Promise<{ stream: Readable; dateiname: string; mimeType: string }> {
    const beleg = await this.prisma.beleg.findUnique({
      where: { id: belegId },
      include: {
        position: { include: { antrag: { include: { mitarbeitende: true } } } },
      },
    });
    if (!beleg) {
      throw new NotFoundException(`Beleg ${belegId} nicht gefunden`);
    }
    const mitarbeitende = beleg.position.antrag.mitarbeitende;
    const darf =
      user.rolle === Rolle.LOHNBUCHHALTUNG ||
      mitarbeitende.id === user.id ||
      (user.rolle === Rolle.VORGESETZTE &&
        mitarbeitende.vorgesetzteId === user.id);
    if (!darf) {
      throw new NotFoundException(`Beleg ${belegId} nicht gefunden`);
    }
    return {
      stream: createReadStream(join(this.uploadDir, beleg.pfad)),
      dateiname: beleg.dateiname,
      mimeType: beleg.mimeType,
    };
  }

  async loeschen(userId: number, belegId: number): Promise<void> {
    const beleg = await this.prisma.beleg.findFirst({
      where: { id: belegId, position: { antrag: { mitarbeitendeId: userId } } },
      include: { position: { include: { antrag: true } } },
    });
    if (!beleg) {
      throw new NotFoundException(`Beleg ${belegId} nicht gefunden`);
    }
    if (!BEARBEITBARE_STATUS.includes(beleg.position.antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${beleg.position.antrag.status} kann nicht bearbeitet werden`,
      );
    }
    await this.prisma.beleg.delete({ where: { id: belegId } });
    await this.dateiLoeschen(beleg.pfad);
  }

  async dateiLoeschen(pfad: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, pfad));
    } catch {
      // Datei fehlt bereits – Datensatz ist massgebend
    }
  }
}
