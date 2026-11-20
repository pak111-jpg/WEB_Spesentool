import { Injectable, NotFoundException } from '@nestjs/common';
import {
  antragInclude,
  AntragMitPositionen,
  toAntragDetailDto,
  toAntragDto,
} from '../antraege/antraege.mapper';
import { AntragDetailDto, AntragDto } from '../antraege/dto/antrag.dto';
import { SICHTBAR_FUER_VORGESETZTE } from '../antraege/statusregeln';
import { statusWechseln } from '../antraege/statuswechsel';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AntragStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { OffenerAntragDto } from './dto/freigabe.dto';

/** Frist für den Entscheid der vorgesetzten Person (VG-4). */
export const ENTSCHEID_FRIST_ARBEITSTAGE = 2;

/** Geschäftslogik: Prüfen und Entscheiden durch Vorgesetzte. */
@Injectable()
export class FreigabeService {
  constructor(private readonly prisma: PrismaService) {}

  /** VG-1: Alle eingereichten Anträge des eigenen Teams. */
  async offene(
    vorgesetzteId: number,
    nurUeberfaellig = false,
  ): Promise<OffenerAntragDto[]> {
    const antraege = await this.prisma.spesenantrag.findMany({
      where: {
        status: AntragStatus.EINGEREICHT,
        mitarbeitende: { vorgesetzteId },
      },
      include: antragInclude,
      orderBy: { eingereichtAm: 'asc' },
    });
    const jetzt = new Date();
    return antraege
      .map((antrag) => {
        const offenSeitArbeitstagen = arbeitstageZwischen(
          antrag.eingereichtAm ?? antrag.erstelltAm,
          jetzt,
        );
        return {
          ...toAntragDto(antrag),
          offenSeitArbeitstagen,
          ueberfaellig: offenSeitArbeitstagen > ENTSCHEID_FRIST_ARBEITSTAGE,
        };
      })
      .filter((antrag) => !nurUeberfaellig || antrag.ueberfaellig);
  }

  /**
   * Alle eingereichten Anträge des Teams (auch entschiedene), optional nach Status gefiltert.
   * Entwürfe (ERFASST) sieht die vorgesetzte Person nicht, sie sind noch privat.
   */
  async team(
    vorgesetzteId: number,
    status?: AntragStatus,
  ): Promise<AntragDto[]> {
    if (status && !SICHTBAR_FUER_VORGESETZTE.includes(status)) {
      return [];
    }
    const antraege = await this.prisma.spesenantrag.findMany({
      where: {
        mitarbeitende: { vorgesetzteId },
        status: status ?? { in: [...SICHTBAR_FUER_VORGESETZTE] },
      },
      include: antragInclude,
      orderBy: [
        { jahr: 'desc' },
        { monat: 'desc' },
        { mitarbeitende: { name: 'asc' } },
      ],
    });
    return antraege.map(toAntragDto);
  }

  /** VG-2: Antrag des eigenen Teams mit Positionen, Belegen und Verlauf. */
  async einer(
    vorgesetzteId: number,
    antragId: number,
  ): Promise<AntragDetailDto> {
    return toAntragDetailDto(
      await this.ladeTeamAntrag(vorgesetzteId, antragId),
    );
  }

  /** VG-2: EINGEREICHT → GENEHMIGT. Danach ist der Antrag nicht mehr veränderbar. */
  async genehmigen(user: AuthUser, antragId: number): Promise<AntragDetailDto> {
    return this.entscheiden(user, antragId, AntragStatus.GENEHMIGT, null);
  }

  /** VG-3: EINGEREICHT → ZURUECKGEWIESEN, Antrag wird wieder bearbeitbar. */
  async zurueckweisen(
    user: AuthUser,
    antragId: number,
    begruendung: string,
  ): Promise<AntragDetailDto> {
    return this.entscheiden(
      user,
      antragId,
      AntragStatus.ZURUECKGEWIESEN,
      begruendung,
    );
  }

  /** EINGEREICHT → ABGELEHNT (endgültig). */
  async ablehnen(
    user: AuthUser,
    antragId: number,
    begruendung: string,
  ): Promise<AntragDetailDto> {
    return this.entscheiden(
      user,
      antragId,
      AntragStatus.ABGELEHNT,
      begruendung,
    );
  }

  /**
   * Gemeinsamer Ablauf für alle drei Entscheide. Unzulässige Übergänge (z. B. einen
   * genehmigten Antrag zurückweisen) verhindert statusWechseln() mit 409.
   */
  private async entscheiden(
    user: AuthUser,
    antragId: number,
    neuerStatus: AntragStatus,
    begruendung: string | null,
  ): Promise<AntragDetailDto> {
    const antrag = await this.ladeTeamAntrag(user.id, antragId);
    const entschieden = await statusWechseln(this.prisma, {
      antragId,
      von: antrag.status,
      nach: neuerStatus,
      user,
      begruendung,
      daten: {
        begruendung,
        entschiedenVonId: user.id,
        entschiedenAm: new Date(),
      },
    });
    return toAntragDetailDto(entschieden);
  }

  private async ladeTeamAntrag(
    vorgesetzteId: number,
    antragId: number,
  ): Promise<AntragMitPositionen> {
    const antrag = await this.prisma.spesenantrag.findFirst({
      where: {
        id: antragId,
        mitarbeitende: { vorgesetzteId },
        status: { in: [...SICHTBAR_FUER_VORGESETZTE] },
      },
      include: antragInclude,
    });
    if (!antrag) {
      throw new NotFoundException(
        `Antrag ${antragId} nicht gefunden oder nicht aus dem eigenen Team`,
      );
    }
    return antrag;
  }
}

/** Zählt volle Arbeitstage (Mo–Fr) zwischen zwei Zeitpunkten. */
export function arbeitstageZwischen(von: Date, bis: Date): number {
  const start = new Date(
    Date.UTC(von.getUTCFullYear(), von.getUTCMonth(), von.getUTCDate()),
  );
  const ende = new Date(
    Date.UTC(bis.getUTCFullYear(), bis.getUTCMonth(), bis.getUTCDate()),
  );
  let tage = 0;
  for (
    const tag = new Date(start);
    tag < ende;
    tag.setUTCDate(tag.getUTCDate() + 1)
  ) {
    const wochentag = tag.getUTCDay();
    if (wochentag !== 0 && wochentag !== 6) {
      tage++;
    }
  }
  return tage;
}
