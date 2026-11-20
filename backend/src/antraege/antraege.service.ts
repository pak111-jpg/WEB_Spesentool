import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../common/decorators/current-user.decorator';
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
import {
  BEARBEITBARE_STATUS,
  istBearbeitbar,
  pruefeVollstaendigkeit,
} from './statusregeln';
import { statusWechseln } from './statuswechsel';

/** Geschäftslogik: Spesenanträge der Mitarbeitenden. */
@Injectable()
export class AntraegeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Neuen Antrag für einen Monat anlegen (Status ERFASST, erster Eintrag im Verlauf). */
  async erstellen(
    user: AuthUser,
    dto: CreateAntragDto,
  ): Promise<AntragDetailDto> {
    const vorhanden = await this.prisma.spesenantrag.findUnique({
      where: {
        mitarbeitendeId_jahr_monat: {
          mitarbeitendeId: user.id,
          jahr: dto.jahr,
          monat: dto.monat,
        },
      },
    });
    if (vorhanden) {
      throw new ConflictException(
        `Für ${dto.monat}/${dto.jahr} existiert bereits eine Abrechnung (ID ${vorhanden.id})`,
      );
    }
    const antrag = await this.prisma.spesenantrag.create({
      data: {
        mitarbeitendeId: user.id,
        jahr: dto.jahr,
        monat: dto.monat,
        verlauf: {
          create: {
            vonStatus: null,
            nachStatus: AntragStatus.ERFASST,
            userId: user.id,
            rolle: user.rolle,
          },
        },
      },
      include: antragInclude,
    });
    return toAntragDetailDto(antrag);
  }

  /** MA-4: Eigene Anträge, neuester Monat zuerst. */
  async meine(userId: number): Promise<AntragDto[]> {
    const antraege = await this.prisma.spesenantrag.findMany({
      where: { mitarbeitendeId: userId },
      include: antragInclude,
      orderBy: [{ jahr: 'desc' }, { monat: 'desc' }],
    });
    return antraege.map(toAntragDto);
  }

  /** Eigenen Antrag mit Positionen und Verlauf laden. */
  async einer(userId: number, antragId: number): Promise<AntragDetailDto> {
    return toAntragDetailDto(await this.ladeEigenen(userId, antragId));
  }

  /** Eigenen Antrag löschen, solange er noch nie eingereicht wurde (Status ERFASST). */
  async loeschen(userId: number, antragId: number): Promise<void> {
    const antrag = await this.ladeEigenen(userId, antragId);
    if (antrag.status !== AntragStatus.ERFASST) {
      throw new ConflictException(
        'Nur Abrechnungen im Status ERFASST können gelöscht werden',
      );
    }
    await this.prisma.spesenantrag.delete({ where: { id: antragId } });
  }

  /**
   * MA-3: Monatsabrechnung einreichen.
   * Nur möglich, wenn jede Position Datum, Betrag, Zweck und Beleg hat und der Person eine
   * vorgesetzte Person zugeordnet ist, die entscheiden kann.
   */
  async einreichen(user: AuthUser, antragId: number): Promise<AntragDetailDto> {
    const antrag = await this.ladeEigenen(user.id, antragId);
    this.pruefeEinreichbar(antrag);
    const eingereicht = await statusWechseln(this.prisma, {
      antragId,
      von: antrag.status,
      nach: AntragStatus.EINGEREICHT,
      user,
      daten: {
        eingereichtAm: new Date(),
        // Entscheid der vorherigen Runde zurücksetzen; er bleibt im Verlauf erhalten
        begruendung: null,
        entschiedenVonId: null,
        entschiedenAm: null,
      },
    });
    return toAntragDetailDto(eingereicht);
  }

  /** Bearbeitbar, vorgesetzte Person zugeordnet und jede Position vollständig? Sonst 409 bzw. 400. */
  private pruefeEinreichbar(antrag: AntragMitPositionen): void {
    this.pruefeBearbeitbar(antrag);
    if (antrag.mitarbeitende.vorgesetzteId === null) {
      throw new ConflictException(
        'Dir ist keine vorgesetzte Person zugeordnet. Die Abrechnung kann erst eingereicht werden, wenn jemand entscheiden kann.',
      );
    }
    const probleme = pruefeVollstaendigkeit(
      antrag.positionen.map((position) => ({
        id: position.id,
        datum: position.datum,
        betrag: Number(position.betrag),
        zweck: position.zweck,
        hatBeleg: position.beleg !== null,
      })),
    );
    if (probleme.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Antrag ist unvollständig und wurde nicht eingereicht',
        probleme,
      });
    }
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

  /** Wirft 409, wenn der Antrag nicht (mehr) bearbeitet werden darf. */
  pruefeBearbeitbar(antrag: { status: AntragStatus }): void {
    if (!istBearbeitbar(antrag.status)) {
      throw new ConflictException(
        `Antrag im Status ${antrag.status} kann nicht bearbeitet werden (nur ${BEARBEITBARE_STATUS.join(', ')})`,
      );
    }
  }
}
