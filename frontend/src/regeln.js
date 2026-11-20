/**
 * Prozesslogik im Browser: Welche Aktion ist in welchem Status möglich?
 * Gleiche Regeln wie im Backend (backend/src/antraege/statusregeln.ts). Die Oberfläche blendet
 * damit Knöpfe aus; durchgesetzt werden die Regeln trotzdem im Backend.
 */
import { STATUS } from './typen.js';

/** Zulässige Übergänge gemäss Zustandsdiagramm (docs/zustandsdiagramm.md). */
export const ERLAUBTE_UEBERGAENGE = {
  [STATUS.ERFASST]: [STATUS.EINGEREICHT],
  [STATUS.EINGEREICHT]: [
    STATUS.GENEHMIGT,
    STATUS.ZURUECKGEWIESEN,
    STATUS.ABGELEHNT,
  ],
  [STATUS.ZURUECKGEWIESEN]: [STATUS.EINGEREICHT],
  [STATUS.GENEHMIGT]: [STATUS.AUSBEZAHLT],
  [STATUS.AUSBEZAHLT]: [],
  [STATUS.ABGELEHNT]: [],
};

/** Ist der Wechsel von `von` nach `nach` vorgesehen? */
export function istUebergangErlaubt(von, nach) {
  return ERLAUBTE_UEBERGAENGE[von].includes(nach);
}

/** Mitarbeitende dürfen Positionen und Belege nur in Erfassung oder nach Rückweisung ändern. */
export function istBearbeitbar(status) {
  return status === STATUS.ERFASST || status === STATUS.ZURUECKGEWIESEN;
}

/** Einreichen ist möglich, solange der Antrag bearbeitbar ist. */
export function kannEinreichen(status) {
  return istUebergangErlaubt(status, STATUS.EINGEREICHT);
}

/** Löschen nur, solange der Antrag noch nie eingereicht wurde. */
export function kannLoeschen(status) {
  return status === STATUS.ERFASST;
}

/** Vorgesetzte entscheiden nur über eingereichte Anträge. */
export function kannEntscheiden(status) {
  return istUebergangErlaubt(status, STATUS.GENEHMIGT);
}

/** Die Lohnbuchhaltung zahlt nur genehmigte Abrechnungen aus. */
export function kannAusbezahlen(status) {
  return istUebergangErlaubt(status, STATUS.AUSBEZAHLT);
}

/** Abrechnungen, auf die die mitarbeitende Person reagieren muss (VG-3: Benachrichtigung). */
export function brauchtKorrektur(antraege) {
  return antraege.filter((antrag) => antrag.status === STATUS.ZURUECKGEWIESEN);
}

/** Summe der Totale (fachliche Auswertung für Listen). */
export function summeTotal(antraege) {
  const summe = antraege.reduce((s, antrag) => s + antrag.total, 0);
  return Math.round(summe * 100) / 100;
}

/**
 * MA-3: Vor dem Einreichen prüfen, ob jede Position Datum, Betrag, Zweck und Beleg hat.
 * Gleiche Regel wie im Backend; so sieht die Person die Probleme sofort.
 */
export function pruefeVollstaendigkeit(positionen) {
  if (positionen.length === 0) {
    return [
      { positionId: null, fehler: ['Der Antrag enthält keine Positionen'] },
    ];
  }
  return positionen
    .map((p) => {
      const fehler = [];
      if (!p.datum) fehler.push('Datum fehlt');
      if (!(p.betrag > 0)) fehler.push('Betrag fehlt oder ist 0');
      if (!p.zweck.trim()) fehler.push('Zweck fehlt');
      if (!p.beleg) fehler.push('Beleg fehlt');
      return { positionId: p.id, fehler };
    })
    .filter((eintrag) => eintrag.fehler.length > 0);
}
