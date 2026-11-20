/**
 * Formatierung von Beträgen und Daten in Schweizer Schreibweise.
 * Reine Funktionen ohne DOM, damit sie überall verwendet werden können.
 */

/** Betrag in Franken, z. B. «CHF 24.90». */
export const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
});

/** "2026-11-05" oder ISO-Zeitstempel → "05.11.2026" (ohne Date, damit keine Zeitzonen-Verschiebung). */
export function datumCH(iso: string): string {
  const [jahr, monat, tag] = iso.slice(0, 10).split('-');
  return `${tag}.${monat}.${jahr}`;
}

/** ISO-Zeitstempel → "05.11.2026, 14:12", null → "-". */
export function zeitpunktCH(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** (2026, 11) → "November 2026". */
export function monatName(jahr: number, monat: number): string {
  return new Date(jahr, monat - 1, 1).toLocaleDateString('de-CH', {
    month: 'long',
    year: 'numeric',
  });
}

/** Name eines Monats ohne Jahr: 1 → "Januar". */
export function monatOhneJahr(monat: number): string {
  return new Date(2000, monat - 1, 1).toLocaleDateString('de-CH', {
    month: 'long',
  });
}

/** Erster und letzter Tag eines Monats als YYYY-MM-DD, für min/max im Datumsfeld. */
export function monatsGrenzen(
  jahr: number,
  monat: number,
): { von: string; bis: string } {
  const mm = String(monat).padStart(2, '0');
  const letzterTag = new Date(jahr, monat, 0).getDate();
  return {
    von: `${jahr}-${mm}-01`,
    bis: `${jahr}-${mm}-${String(letzterTag).padStart(2, '0')}`,
  };
}

/** Heutiges Datum als YYYY-MM-DD in Ortszeit. */
export function heuteIso(): string {
  return new Date().toLocaleDateString('sv-SE');
}

/** Sortierschlüssel für Jahr und Monat: (2026, 3) → 202603. */
export function monatSchluessel(jahr: number, monat: number): number {
  return jahr * 100 + monat;
}
