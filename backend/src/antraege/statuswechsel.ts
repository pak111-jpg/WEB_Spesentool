import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { AntragStatus } from '../generated/prisma/enums';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { antragInclude, AntragMitPositionen } from './antraege.mapper';
import { darfRolleUebergang, istUebergangErlaubt } from './statusregeln';

/** Angaben für einen Statuswechsel. */
export interface Statuswechsel {
  antragId: number;
  von: AntragStatus;
  nach: AntragStatus;
  user: AuthUser;
  begruendung?: string | null;
  /** Weitere Felder, die zusammen mit dem Status gesetzt werden (z. B. entschiedenAm). */
  daten?: Prisma.SpesenantragUncheckedUpdateManyInput;
}

/**
 * Prüft einen Übergang gegen das Zustandsdiagramm und die Rolle.
 * Wirft 409 bei unzulässigem Übergang und 403, wenn die Rolle ihn nicht auslösen darf.
 */
export function pruefeUebergang(
  von: AntragStatus,
  nach: AntragStatus,
  user: AuthUser,
): void {
  if (!istUebergangErlaubt(von, nach)) {
    throw new ConflictException(
      `Übergang von ${von} nach ${nach} ist nicht erlaubt`,
    );
  }
  if (!darfRolleUebergang(user.rolle, nach)) {
    throw new ForbiddenException(
      `Die Rolle ${user.rolle} darf nicht nach ${nach} wechseln`,
    );
  }
}

/**
 * Wechselt den Status atomar und schreibt den Eintrag im Verlauf.
 * Das Update greift nur, wenn der Antrag noch im erwarteten Status `von` ist. Hat ihn
 * inzwischen jemand anders geändert (oder wurde doppelt geklickt), gibt es 409 statt
 * eines zweiten Wechsels.
 */
export async function statusWechseln(
  prisma: PrismaService,
  wechsel: Statuswechsel,
): Promise<AntragMitPositionen> {
  const { antragId, von, nach, user } = wechsel;
  pruefeUebergang(von, nach, user);

  await prisma.$transaction(async (tx) => {
    const ergebnis = await tx.spesenantrag.updateMany({
      where: { id: antragId, status: von },
      data: { ...wechsel.daten, status: nach },
    });
    if (ergebnis.count === 0) {
      throw new ConflictException(
        'Der Antrag wurde inzwischen geändert. Bitte die Seite neu laden.',
      );
    }
    await tx.statusAenderung.create({
      data: verlaufEintrag(antragId, von, nach, user, wechsel.begruendung),
    });
  });

  return prisma.spesenantrag.findUniqueOrThrow({
    where: { id: antragId },
    include: antragInclude,
  });
}

/** Datensatz für den Verlauf (wer hat wann von welchem in welchen Status gewechselt). */
export function verlaufEintrag(
  antragId: number,
  von: AntragStatus | null,
  nach: AntragStatus,
  user: AuthUser,
  begruendung: string | null = null,
): Prisma.StatusAenderungUncheckedCreateInput {
  return {
    antragId,
    vonStatus: von,
    nachStatus: nach,
    userId: user.id,
    rolle: user.rolle,
    begruendung,
  };
}
