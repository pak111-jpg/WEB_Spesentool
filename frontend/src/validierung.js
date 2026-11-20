/**
 * Validierungsregeln für Eingaben. Jede Regel bekommt den Text aus dem Feld und liefert
 * eine Fehlermeldung oder null. Reine Funktionen ohne DOM, wiederverwendbar in allen Formularen.
 * Die Anzeige der Meldung beim Feld übernimmt formular.ts.
 */
import { BELEG_MAX_BYTES, BELEG_TYPEN } from './typen.js';

/**
 * Eine Regel: Fehlermeldung oder null, wenn der Wert gültig ist.
 * @typedef {(wert: string) => string | null} Regel
 */

/** Das Feld darf nicht leer sein. */
export function pflicht(name) {
  return (wert) => (wert.trim() === '' ? `${name} fehlt.` : null);
}

/** Mindestanzahl Zeichen (ohne Leerzeichen am Rand). */
export function minLaenge(anzahl, name) {
  return (wert) =>
    wert.trim().length < anzahl
      ? `${name} braucht mindestens ${anzahl} Zeichen.`
      : null;
}

/** Zahl grösser als 0 mit höchstens `stellen` Nachkommastellen (z. B. Betrag, Kilometer). */
export function positiveZahl(name, stellen) {
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
export function ganzzahlZwischen(min, max, name) {
  return (wert) => {
    const zahl = Number(wert);
    return Number.isInteger(zahl) && zahl >= min && zahl <= max
      ? null
      : `${name} muss zwischen ${min} und ${max} liegen.`;
  };
}

/** Datum (YYYY-MM-DD) innerhalb der Grenzen, z. B. im Abrechnungsmonat. */
export function datumZwischen(von, bis) {
  return (wert) => {
    if (wert === '') return 'Datum fehlt.';
    return wert < von || wert > bis
      ? 'Das Datum muss im Abrechnungsmonat liegen.'
      : null;
  };
}

/** Gültige E-Mail-Adresse (einfache Prüfung: etwas@etwas.etwas). */
export function email() {
  return (wert) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert.trim())
      ? null
      : 'Bitte eine gültige E-Mail-Adresse eingeben.';
}

/** Erste Fehlermeldung aller Regeln oder null. */
export function pruefe(wert, regeln) {
  for (const regel of regeln) {
    const fehler = regel(wert);
    if (fehler !== null) return fehler;
  }
  return null;
}

/** Beleg-Datei prüfen: erlaubter Typ (Foto oder PDF) und höchstens 10 MB. */
export function pruefeBeleg(datei) {
  if (!BELEG_TYPEN.includes(datei.type)) {
    return 'Nur Fotos (JPG, PNG, WebP, HEIC) oder PDF sind als Beleg erlaubt.';
  }
  if (datei.size > BELEG_MAX_BYTES) {
    return 'Der Beleg ist grösser als 10 MB.';
  }
  return null;
}
