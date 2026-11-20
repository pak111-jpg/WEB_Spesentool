import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  antragInclude,
  berechneTotal,
  toAntragDetailDto,
  toAntragDto,
} from '../antraege/antraege.mapper';
import { AntragDetailDto, AntragDto } from '../antraege/dto/antrag.dto';
import { SICHTBAR_FUER_LOHNBUCHHALTUNG } from '../antraege/statusregeln';
import { statusWechseln, verlaufEintrag } from '../antraege/statuswechsel';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AntragStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  AbrechnungenQueryDto,
  AusbezahltErgebnisDto,
  KostenstellenAuswertungDto,
} from './dto/lohnbuchhaltung.dto';

@Injectable()
export class LohnbuchhaltungService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Abrechnungen aller Mitarbeitenden. Die Lohnbuchhaltung sieht nur GENEHMIGT und AUSBEZAHLT;
   * ohne Statusfilter beide, sonst den gewählten.
   */
  async abrechnungen(query: AbrechnungenQueryDto): Promise<AntragDto[]> {
    if (query.status && !SICHTBAR_FUER_LOHNBUCHHALTUNG.includes(query.status)) {
      return [];
    }
    const antraege = await this.prisma.spesenantrag.findMany({
      where: {
        jahr: query.jahr,
        monat: query.monat,
        status: query.status ?? { in: [...SICHTBAR_FUER_LOHNBUCHHALTUNG] },
      },
      include: antragInclude,
      orderBy: [
        { jahr: 'desc' },
        { monat: 'desc' },
        { mitarbeitende: { personalnummer: 'asc' } },
      ],
    });
    return antraege.map(toAntragDto);
  }

  /** LB-2: Eine genehmigte oder ausbezahlte Abrechnung mit Positionen, Belegen und Verlauf. */
  async eine(antragId: number): Promise<AntragDetailDto> {
    const antrag = await this.prisma.spesenantrag.findFirst({
      where: {
        id: antragId,
        status: { in: [...SICHTBAR_FUER_LOHNBUCHHALTUNG] },
      },
      include: antragInclude,
    });
    if (!antrag) {
      throw new NotFoundException(`Abrechnung ${antragId} nicht gefunden`);
    }
    return toAntragDetailDto(antrag);
  }

  /**
   * LB-1: Export als CSV (Semikolon-getrennt, Excel-tauglich).
   * Enthält ausschliesslich Abrechnungen mit Status GENEHMIGT des Monats –
   * bereits ausbezahlte erscheinen nicht erneut.
   */
  async exportCsv(jahr: number, monat: number): Promise<string> {
    const antraege = await this.prisma.spesenantrag.findMany({
      where: { jahr, monat, status: AntragStatus.GENEHMIGT },
      include: antragInclude,
      orderBy: { mitarbeitende: { personalnummer: 'asc' } },
    });
    const monatText = `${jahr}-${String(monat).padStart(2, '0')}`;
    const zeilen = [
      [
        'AntragId',
        'Personalnummer',
        'Name',
        'Monat',
        'Kostenstelle',
        'AnzahlPositionen',
        'TotalCHF',
      ],
      ...antraege.map((a) => [
        a.id,
        a.mitarbeitende.personalnummer,
        a.mitarbeitende.name,
        monatText,
        a.mitarbeitende.kostenstelle,
        a.positionen.length,
        berechneTotal(a.positionen).toFixed(2),
      ]),
    ];
    return (
      zeilen.map((zeile) => zeile.map(csvFeld).join(';')).join('\r\n') + '\r\n'
    );
  }

  /** LB-3: Einzelne Abrechnung GENEHMIGT → AUSBEZAHLT (Endzustand). */
  async alsAusbezahltMarkieren(
    user: AuthUser,
    antragId: number,
  ): Promise<AntragDetailDto> {
    const antrag = await this.prisma.spesenantrag.findUnique({
      where: { id: antragId },
    });
    if (!antrag) {
      throw new NotFoundException(`Abrechnung ${antragId} nicht gefunden`);
    }
    if (antrag.status === AntragStatus.AUSBEZAHLT) {
      throw new ConflictException('Abrechnung ist bereits ausbezahlt');
    }
    if (antrag.status !== AntragStatus.GENEHMIGT) {
      throw new ConflictException(
        `Nur genehmigte Abrechnungen können ausbezahlt werden (Status ist ${antrag.status})`,
      );
    }
    const ausbezahlt = await statusWechseln(this.prisma, {
      antragId,
      von: AntragStatus.GENEHMIGT,
      nach: AntragStatus.AUSBEZAHLT,
      user,
      daten: { ausbezahltVonId: user.id, ausbezahltAm: new Date() },
    });
    return toAntragDetailDto(ausbezahlt);
  }

  /**
   * LB-5: Alle genehmigten Abrechnungen eines Monats auf einmal als ausbezahlt markieren
   * (Monatsende). Läuft in einer Transaktion: Status und Verlauf werden gemeinsam gespeichert.
   */
  async monatAusbezahlen(
    user: AuthUser,
    jahr: number,
    monat: number,
  ): Promise<AusbezahltErgebnisDto> {
    return this.prisma.$transaction(async (tx) => {
      const genehmigte = await tx.spesenantrag.findMany({
        where: { jahr, monat, status: AntragStatus.GENEHMIGT },
        select: { id: true },
      });
      const antragIds = genehmigte.map((a) => a.id);
      if (antragIds.length === 0) {
        return { anzahl: 0, antragIds };
      }
      await tx.spesenantrag.updateMany({
        where: { id: { in: antragIds }, status: AntragStatus.GENEHMIGT },
        data: {
          status: AntragStatus.AUSBEZAHLT,
          ausbezahltVonId: user.id,
          ausbezahltAm: new Date(),
        },
      });
      await tx.statusAenderung.createMany({
        data: antragIds.map((id) =>
          verlaufEintrag(
            id,
            AntragStatus.GENEHMIGT,
            AntragStatus.AUSBEZAHLT,
            user,
          ),
        ),
      });
      return { anzahl: antragIds.length, antragIds };
    });
  }

  /** LB-4: Spesen pro Kostenstelle (genehmigt + ausbezahlt). */
  async auswertungKostenstellen(
    jahr: number,
    monat: number,
  ): Promise<KostenstellenAuswertungDto[]> {
    const antraege = await this.prisma.spesenantrag.findMany({
      where: {
        jahr,
        monat,
        status: { in: [AntragStatus.GENEHMIGT, AntragStatus.AUSBEZAHLT] },
      },
      include: antragInclude,
    });
    const proKostenstelle = new Map<string, KostenstellenAuswertungDto>();
    for (const antrag of antraege) {
      const kostenstelle = antrag.mitarbeitende.kostenstelle;
      const eintrag = proKostenstelle.get(kostenstelle) ?? {
        kostenstelle,
        anzahlAbrechnungen: 0,
        anzahlPositionen: 0,
        total: 0,
      };
      eintrag.anzahlAbrechnungen++;
      eintrag.anzahlPositionen += antrag.positionen.length;
      eintrag.total =
        Math.round((eintrag.total + berechneTotal(antrag.positionen)) * 100) /
        100;
      proKostenstelle.set(kostenstelle, eintrag);
    }
    return [...proKostenstelle.values()].sort((a, b) =>
      a.kostenstelle.localeCompare(b.kostenstelle),
    );
  }
}

function csvFeld(wert: string | number): string {
  const text = String(wert);
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
