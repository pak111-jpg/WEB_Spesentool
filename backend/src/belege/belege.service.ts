import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { toBelegDto } from '../antraege/antraege.mapper';
import {
  istBearbeitbar,
  SICHTBAR_FUER_LOHNBUCHHALTUNG,
  SICHTBAR_FUER_VORGESETZTE,
} from '../antraege/statusregeln';
import { BelegDto } from '../antraege/dto/antrag.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

/** Erlaubte Dateitypen für Belege (Fotos und PDF). */
export const ERLAUBTE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];
/** Maximale Grösse eines Belegs: 10 MB. */
export const MAX_BELEG_BYTES = 10 * 1024 * 1024;

/** Datei, wie sie Multer aus dem Upload liefert. */
export interface HochgeladeneDatei {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Geschäftslogik: Belegdateien. */
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
    const gueltig = this.pruefeDatei(datei);
    const position = await this.ladeBearbeitbarePosition(userId, positionId);

    await mkdir(this.uploadDir, { recursive: true });
    const pfad = `${randomUUID()}${extname(gueltig.originalname).toLowerCase()}`;
    await writeFile(join(this.uploadDir, pfad), gueltig.buffer);
    if (position.beleg) {
      await this.dateiLoeschen(position.beleg.pfad);
    }

    const daten = {
      dateiname: gueltig.originalname,
      mimeType: gueltig.mimetype,
      groesse: gueltig.size,
      pfad,
    };
    const beleg = await this.prisma.beleg.upsert({
      where: { positionId },
      create: { positionId, ...daten },
      update: daten,
    });
    return toBelegDto(beleg);
  }

  /** Datei vorhanden und erlaubter Typ? Sonst 400. */
  private pruefeDatei(datei: HochgeladeneDatei | undefined): HochgeladeneDatei {
    if (!datei) {
      throw new BadRequestException('Keine Datei im Feld "datei" mitgeschickt');
    }
    if (!ERLAUBTE_MIME_TYPES.includes(datei.mimetype)) {
      throw new BadRequestException(
        `Dateityp ${datei.mimetype} nicht erlaubt (${ERLAUBTE_MIME_TYPES.join(', ')})`,
      );
    }
    return datei;
  }

  /** Eigene Position laden; der Antrag muss noch bearbeitbar sein (sonst 404 bzw. 409). */
  private async ladeBearbeitbarePosition(userId: number, positionId: number) {
    const position = await this.prisma.position.findFirst({
      where: { id: positionId, antrag: { mitarbeitendeId: userId } },
      include: { beleg: true, antrag: true },
    });
    if (!position) {
      throw new NotFoundException(`Position ${positionId} nicht gefunden`);
    }
    if (!istBearbeitbar(position.antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${position.antrag.status} kann nicht bearbeitet werden`,
      );
    }
    return position;
  }

  /**
   * LB-2 / VG-2: Beleg abrufen. Erlaubt für die Person selbst, ihre vorgesetzte Person
   * (sobald eingereicht) und die Lohnbuchhaltung (sobald genehmigt).
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
    const { mitarbeitende, status } = beleg.position.antrag;
    const darf =
      mitarbeitende.id === user.id ||
      (user.rolle === Rolle.LOHNBUCHHALTUNG &&
        SICHTBAR_FUER_LOHNBUCHHALTUNG.includes(status)) ||
      (user.rolle === Rolle.VORGESETZTE &&
        mitarbeitende.vorgesetzteId === user.id &&
        SICHTBAR_FUER_VORGESETZTE.includes(status));
    if (!darf) {
      throw new NotFoundException(`Beleg ${belegId} nicht gefunden`);
    }
    const datei = join(this.uploadDir, beleg.pfad);
    try {
      await access(datei);
    } catch {
      throw new NotFoundException(
        'Die Belegdatei fehlt auf dem Server. Bitte den Beleg neu hochladen lassen.',
      );
    }
    return {
      stream: createReadStream(datei),
      dateiname: beleg.dateiname,
      mimeType: beleg.mimeType,
    };
  }

  /** Beleg entfernen, solange der Antrag bearbeitbar ist. */
  async loeschen(userId: number, belegId: number): Promise<void> {
    const beleg = await this.prisma.beleg.findFirst({
      where: { id: belegId, position: { antrag: { mitarbeitendeId: userId } } },
      include: { position: { include: { antrag: true } } },
    });
    if (!beleg) {
      throw new NotFoundException(`Beleg ${belegId} nicht gefunden`);
    }
    if (!istBearbeitbar(beleg.position.antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${beleg.position.antrag.status} kann nicht bearbeitet werden`,
      );
    }
    await this.prisma.beleg.delete({ where: { id: belegId } });
    await this.dateiLoeschen(beleg.pfad);
  }

  /** Datei im Upload-Ordner löschen; fehlt sie schon, ist das kein Fehler. */
  async dateiLoeschen(pfad: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, pfad));
    } catch {
      // Datei fehlt bereits – Datensatz ist massgebend
    }
  }
}
