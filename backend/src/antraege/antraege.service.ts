import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AntragStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  antragInclude,
  AntragMitPositionen,
  toAntragDetailDto,
  toAntragDto,
} from './antraege.mapper';
import { AntragDetailDto, AntragDto } from './dto/antrag.dto';
import { CreateAntragDto } from './dto/create-antrag.dto';
import { PositionFehlerDto } from './dto/einreichen-fehler.dto';

/** Zustände, in denen Mitarbeitende den Antrag noch bearbeiten dürfen. */
export const BEARBEITBARE_STATUS: AntragStatus[] = [
  AntragStatus.ERFASST,
  AntragStatus.ZURUECKGEWIESEN,
];

@Injectable()
export class AntraegeService {
  constructor(private readonly prisma: PrismaService) {}

  async erstellen(
    userId: number,
    dto: CreateAntragDto,
  ): Promise<AntragDetailDto> {
    const vorhanden = await this.prisma.spesenantrag.findUnique({
      where: {
        mitarbeitendeId_jahr_monat: {
          mitarbeitendeId: userId,
          jahr: dto.jahr,
          monat: dto.monat,
        },
      },
    });
    if (vorhanden) {
      throw new ConflictException(
        `Für ${dto.monat}/${dto.jahr} existiert bereits ein Antrag (ID ${vorhanden.id})`,
      );
    }
    const antrag = await this.prisma.spesenantrag.create({
      data: { mitarbeitendeId: userId, jahr: dto.jahr, monat: dto.monat },
      include: antragInclude,
    });
    return toAntragDetailDto(antrag);
  }

  async meine(userId: number): Promise<AntragDto[]> {
    const antraege = await this.prisma.spesenantrag.findMany({
      where: { mitarbeitendeId: userId },
      include: antragInclude,
      orderBy: [{ jahr: 'desc' }, { monat: 'desc' }],
    });
    return antraege.map(toAntragDto);
  }

  async einer(userId: number, antragId: number): Promise<AntragDetailDto> {
    return toAntragDetailDto(await this.ladeEigenen(userId, antragId));
  }

  async loeschen(userId: number, antragId: number): Promise<void> {
    const antrag = await this.ladeEigenen(userId, antragId);
    if (antrag.status !== AntragStatus.ERFASST) {
      throw new ConflictException(
        'Nur Anträge im Status ERFASST können gelöscht werden',
      );
    }
    await this.prisma.spesenantrag.delete({ where: { id: antragId } });
  }

  /**
   * Monatsabrechnung einreichen (MA-3).
   * Nur möglich, wenn jede Position Datum, Betrag, Zweck und Beleg hat.
   */
  async einreichen(userId: number, antragId: number): Promise<AntragDetailDto> {
    const antrag = await this.ladeEigenen(userId, antragId);
    this.pruefeBearbeitbar(antrag);

    const probleme = this.pruefeVollstaendigkeit(antrag);
    if (probleme.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Antrag ist unvollständig und wurde nicht eingereicht',
        probleme,
      });
    }

    const eingereicht = await this.prisma.spesenantrag.update({
      where: { id: antragId },
      data: {
        status: AntragStatus.EINGEREICHT,
        eingereichtAm: new Date(),
        // Entscheid der vorherigen Runde zurücksetzen
        begruendung: null,
        entschiedenVonId: null,
        entschiedenAm: null,
      },
      include: antragInclude,
    });
    return toAntragDetailDto(eingereicht);
  }

  /** Lädt einen Antrag und stellt sicher, dass er der angemeldeten Person gehört. */
  async ladeEigenen(
    userId: number,
    antragId: number,
  ): Promise<AntragMitPositionen> {
    const antrag = await this.prisma.spesenantrag.findFirst({
      where: { id: antragId, mitarbeitendeId: userId },
      include: antragInclude,
    });
    if (!antrag) {
      throw new NotFoundException(`Antrag ${antragId} nicht gefunden`);
    }
    return antrag;
  }

  pruefeBearbeitbar(antrag: { status: AntragStatus }): void {
    if (!BEARBEITBARE_STATUS.includes(antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${antrag.status} kann nicht bearbeitet werden (nur ${BEARBEITBARE_STATUS.join(', ')})`,
      );
    }
  }

  private pruefeVollstaendigkeit(
    antrag: AntragMitPositionen,
  ): PositionFehlerDto[] {
    const probleme: PositionFehlerDto[] = [];
    if (antrag.positionen.length === 0) {
      probleme.push({
        positionId: null,
        fehler: ['Der Antrag enthält keine Positionen'],
      });
    }
    for (const position of antrag.positionen) {
      const fehler: string[] = [];
      if (!position.datum) fehler.push('Datum fehlt');
      if (Number(position.betrag) <= 0) fehler.push('Betrag fehlt oder ist 0');
      if (!position.zweck?.trim()) fehler.push('Zweck fehlt');
      if (!position.beleg) fehler.push('Beleg fehlt');
      if (fehler.length > 0) {
        probleme.push({ positionId: position.id, fehler });
      }
    }
    return probleme;
  }
}
