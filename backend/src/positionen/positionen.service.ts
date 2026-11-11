import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AntraegeService } from '../antraege/antraege.service';
import { PositionMitBeleg, toPositionDto } from '../antraege/antraege.mapper';
import { PositionDto } from '../antraege/dto/antrag.dto';
import { Kategorie } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BelegeService } from '../belege/belege.service';
import { CreatePositionDto, UpdatePositionDto } from './dto/position-input.dto';

@Injectable()
export class PositionenService {
  private readonly kilometerpauschale: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly antraegeService: AntraegeService,
    private readonly belegeService: BelegeService,
    config: ConfigService,
  ) {
    this.kilometerpauschale = Number(
      config.get('KILOMETERPAUSCHALE_CHF', '0.70'),
    );
  }

  getKilometerpauschale(): number {
    return this.kilometerpauschale;
  }

  async erstellen(
    userId: number,
    antragId: number,
    dto: CreatePositionDto,
  ): Promise<PositionDto> {
    const antrag = await this.antraegeService.ladeEigenen(userId, antragId);
    this.antraegeService.pruefeBearbeitbar(antrag);

    const datum = this.parseDatum(dto.datum, antrag.jahr, antrag.monat);
    const { kilometer, betrag } = this.berechneBetrag(
      dto.kategorie,
      dto.kilometer,
      dto.betrag,
    );

    const position = await this.prisma.position.create({
      data: {
        antragId,
        datum,
        kategorie: dto.kategorie,
        zweck: dto.zweck.trim(),
        kilometer,
        betrag,
      },
      include: { beleg: true },
    });
    return toPositionDto(position);
  }

  async aktualisieren(
    userId: number,
    positionId: number,
    dto: UpdatePositionDto,
  ): Promise<PositionDto> {
    const position = await this.ladeEigene(userId, positionId);
    const antrag = await this.antraegeService.ladeEigenen(
      userId,
      position.antragId,
    );
    this.antraegeService.pruefeBearbeitbar(antrag);

    const kategorie = dto.kategorie ?? position.kategorie;
    const { kilometer, betrag } = this.berechneBetrag(
      kategorie,
      dto.kilometer ??
        (position.kilometer === null ? undefined : Number(position.kilometer)),
      dto.betrag ?? Number(position.betrag),
    );

    const aktualisiert = await this.prisma.position.update({
      where: { id: positionId },
      data: {
        datum: dto.datum
          ? this.parseDatum(dto.datum, antrag.jahr, antrag.monat)
          : undefined,
        kategorie,
        zweck: dto.zweck?.trim(),
        kilometer,
        betrag,
      },
      include: { beleg: true },
    });
    return toPositionDto(aktualisiert);
  }

  async loeschen(userId: number, positionId: number): Promise<void> {
    const position = await this.ladeEigene(userId, positionId);
    const antrag = await this.antraegeService.ladeEigenen(
      userId,
      position.antragId,
    );
    this.antraegeService.pruefeBearbeitbar(antrag);

    if (position.beleg) {
      await this.belegeService.dateiLoeschen(position.beleg.pfad);
    }
    await this.prisma.position.delete({ where: { id: positionId } });
  }

  /** Lädt eine Position inkl. Beleg und stellt sicher, dass der Antrag der Person gehört. */
  async ladeEigene(
    userId: number,
    positionId: number,
  ): Promise<PositionMitBeleg> {
    const position = await this.prisma.position.findFirst({
      where: { id: positionId, antrag: { mitarbeitendeId: userId } },
      include: { beleg: true },
    });
    if (!position) {
      throw new NotFoundException(`Position ${positionId} nicht gefunden`);
    }
    return position;
  }

  /**
   * MA-2: Bei FAHRT rechnet das System Kilometer × Pauschale, sonst gilt der eingegebene Betrag.
   */
  private berechneBetrag(
    kategorie: Kategorie,
    kilometer: number | undefined,
    betrag: number | undefined,
  ): { kilometer: number | null; betrag: number } {
    if (kategorie === Kategorie.FAHRT) {
      if (kilometer === undefined) {
        throw new BadRequestException(
          'Bei Kategorie FAHRT sind die Kilometer anzugeben',
        );
      }
      return {
        kilometer,
        betrag: Math.round(kilometer * this.kilometerpauschale * 100) / 100,
      };
    }
    if (betrag === undefined) {
      throw new BadRequestException(
        `Bei Kategorie ${kategorie} ist der Betrag anzugeben`,
      );
    }
    return { kilometer: null, betrag };
  }

  private parseDatum(datum: string, jahr: number, monat: number): Date {
    const date = new Date(datum);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ungültiges Datum');
    }
    if (date.getUTCFullYear() !== jahr || date.getUTCMonth() + 1 !== monat) {
      throw new BadRequestException(
        `Das Datum muss im Abrechnungsmonat ${monat}/${jahr} liegen`,
      );
    }
    return date;
  }
}
