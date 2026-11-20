/**
 * Fachliche Regeln zum Lebenszyklus eines Spesenantrags, an EINER Stelle.
 * Entspricht dem Zustandsdiagramm in docs/zustandsdiagramm.md.
 *
 * Bewusst ohne NestJS und ohne Datenbank: reine Funktionen, die sich einfach testen lassen
 * (siehe statusregeln.spec.ts). Die Services rufen diese Funktionen auf, bevor sie speichern.
 */
import { AntragStatus, Rolle } from '../generated/prisma/enums';

const {
  ERFASST,
  EINGEREICHT,
  ZURUECKGEWIESEN,
  GENEHMIGT,
  AUSBEZAHLT,
  ABGELEHNT,
} = AntragStatus;

/** Zulässige Übergänge: von welchem Status in welchen Status gewechselt werden darf. */
export const ERLAUBTE_UEBERGAENGE: Record<
  AntragStatus,
  readonly AntragStatus[]
> = {
  [ERFASST]: [EINGEREICHT],
  [EINGEREICHT]: [GENEHMIGT, ZURUECKGEWIESEN, ABGELEHNT],
  [ZURUECKGEWIESEN]: [EINGEREICHT],
  [GENEHMIGT]: [AUSBEZAHLT],
  [AUSBEZAHLT]: [],
  [ABGELEHNT]: [],
};

/** Wer welchen Übergang auslösen darf (Zielstatus → Rolle). */
export const ROLLE_FUER_ZIELSTATUS: Record<AntragStatus, Rolle> = {
  [ERFASST]: Rolle.MITARBEITENDE,
  [EINGEREICHT]: Rolle.MITARBEITENDE,
  [GENEHMIGT]: Rolle.VORGESETZTE,
  [ZURUECKGEWIESEN]: Rolle.VORGESETZTE,
  [ABGELEHNT]: Rolle.VORGESETZTE,
  [AUSBEZAHLT]: Rolle.LOHNBUCHHALTUNG,
};

/** In diesen Status darf die mitarbeitende Person Positionen und Belege ändern. */
export const BEARBEITBARE_STATUS: readonly AntragStatus[] = [
  ERFASST,
  ZURUECKGEWIESEN,
];

/** Diese Status sehen Vorgesetzte: alles ausser Entwürfen, die noch nicht eingereicht wurden. */
export const SICHTBAR_FUER_VORGESETZTE: readonly AntragStatus[] = [
  EINGEREICHT,
  ZURUECKGEWIESEN,
  GENEHMIGT,
  AUSBEZAHLT,
  ABGELEHNT,
];

/** Diese Status sieht die Lohnbuchhaltung: nur, was ausbezahlt wird oder wurde. */
export const SICHTBAR_FUER_LOHNBUCHHALTUNG: readonly AntragStatus[] = [
  GENEHMIGT,
  AUSBEZAHLT,
];

/** Ist der Wechsel von `von` nach `nach` im Zustandsdiagramm vorgesehen? */
export function istUebergangErlaubt(
  von: AntragStatus,
  nach: AntragStatus,
): boolean {
  return ERLAUBTE_UEBERGAENGE[von].includes(nach);
}

/** Darf die Rolle diesen Übergang auslösen? (z. B. genehmigen nur Vorgesetzte) */
export function darfRolleUebergang(rolle: Rolle, nach: AntragStatus): boolean {
  return ROLLE_FUER_ZIELSTATUS[nach] === rolle;
}

/** Darf die mitarbeitende Person den Antrag noch bearbeiten? */
export function istBearbeitbar(status: AntragStatus): boolean {
  return BEARBEITBARE_STATUS.includes(status);
}

/** Ist der Status ein Endzustand (keine Übergänge mehr möglich)? */
export function istEndzustand(status: AntragStatus): boolean {
  return ERLAUBTE_UEBERGAENGE[status].length === 0;
}

/** Eine Position, wie sie für die Vollständigkeitsprüfung gebraucht wird. */
export interface PruefPosition {
  id: number;
  datum: Date | null;
  betrag: number;
  zweck: string | null;
  hatBeleg: boolean;
}

/** Fehler einer Position; positionId ist null bei Fehlern am ganzen Antrag. */
export interface PositionFehler {
  positionId: number | null;
  fehler: string[];
}

/**
 * MA-3: Ein Antrag darf nur eingereicht werden, wenn er Positionen hat und jede Position
 * Datum, Betrag, Zweck und Beleg hat. Liefert alle Probleme (leere Liste = vollständig).
 */
export function pruefeVollstaendigkeit(
  positionen: PruefPosition[],
): PositionFehler[] {
  if (positionen.length === 0) {
    return [
      { positionId: null, fehler: ['Der Antrag enthält keine Positionen'] },
    ];
  }
  return positionen
    .map((position) => ({
      positionId: position.id,
      fehler: fehlerEinerPosition(position),
    }))
    .filter((eintrag) => eintrag.fehler.length > 0);
}

function fehlerEinerPosition(position: PruefPosition): string[] {
  const fehler: string[] = [];
  if (!position.datum) fehler.push('Datum fehlt');
  if (!(position.betrag > 0)) fehler.push('Betrag fehlt oder ist 0');
  if (!position.zweck?.trim()) fehler.push('Zweck fehlt');
  if (!position.hatBeleg) fehler.push('Beleg fehlt');
  return fehler;
}
