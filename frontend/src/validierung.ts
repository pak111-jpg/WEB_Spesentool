/**
 * Validierungsregeln für Eingaben. Jede Regel bekommt den Text aus dem Feld und liefert
 * eine Fehlermeldung oder null. Reine Funktionen ohne DOM, wiederverwendbar in allen Formularen.
 * Die Anzeige der Meldung beim Feld übernimmt formular.ts.
 */
import { BELEG_MAX_BYTES, BELEG_TYPEN } from './typen';

/** Eine Regel: Fehlermeldung oder null, wenn der Wert gültig ist. */
export type Regel = (wert: string) => string | null;

/** Das Feld darf nicht leer sein. */
export function pflicht(name: string): Regel {
  return (wert) => (wert.trim() === '' ? `${name} fehlt.` : null);
}

/** Mindestanzahl Zeichen (ohne Leerzeichen am Rand). */
export function minLaenge(anzahl: number, name: string): Regel {
  return (wert) =>
    wert.trim().length < anzahl
      ? `${name} braucht mindestens ${anzahl} Zeichen.`
      : null;
}

/** Zahl grösser als 0 mit höchstens `stellen` Nachkommastellen (z. B. Betrag, Kilometer). */
export function positiveZahl(name: string, stellen: number): Regel {
  return (wert) => {
    const zahl = Number(wert);
    if (wert.trim() === '' || Number.isNaN(zahl)) return `${name} fehlt.`;
    if (zahl <= 0) return `${name} muss grösser als 0 sein.`;
    const nachkomma = wert.split('.')[1] ?? '';
    if (nachkomma.length > stellen) {
      return `${name}: höchstens ${stellen} Stelle(n) nach dem Punkt.`;
    }
    return null;
  };
}

/** Ganze Zahl zwischen min und max (z. B. Jahr). */
export function ganzzahlZwischen(
  min: number,
  max: number,
  name: string,
): Regel {
  return (wert) => {
    const zahl = Number(wert);
    return Number.isInteger(zahl) && zahl >= min && zahl <= max
      ? null
      : `${name} muss zwischen ${min} und ${max} liegen.`;
  };
}

/** Datum (YYYY-MM-DD) innerhalb der Grenzen, z. B. im Abrechnungsmonat. */
export function datumZwischen(von: string, bis: string): Regel {
  return (wert) => {
    if (wert === '') return 'Datum fehlt.';
    return wert < von || wert > bis
      ? 'Das Datum muss im Abrechnungsmonat liegen.'
      : null;
  };
}

/** Gültige E-Mail-Adresse (einfache Prüfung: etwas@etwas.etwas). */
export function email(): Regel {
  return (wert) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert.trim())
      ? null
      : 'Bitte eine gültige E-Mail-Adresse eingeben.';
}

/** Erste Fehlermeldung aller Regeln oder null. */
export function pruefe(wert: string, regeln: Regel[]): string | null {
  for (const regel of regeln) {
    const fehler = regel(wert);
    if (fehler !== null) return fehler;
  }
  return null;
}

/** Beleg-Datei prüfen: erlaubter Typ (Foto oder PDF) und höchstens 10 MB. */
export function pruefeBeleg(datei: File): string | null {
  if (!BELEG_TYPEN.includes(datei.type)) {
    return 'Nur Fotos (JPG, PNG, WebP, HEIC) oder PDF sind als Beleg erlaubt.';
  }
  if (datei.size > BELEG_MAX_BYTES) {
    return 'Der Beleg ist grösser als 10 MB.';
  }
  return null;
}
