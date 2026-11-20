/**
 * Anzeigetexte für feste Werte (Status, Rollen, Kategorien) an einer Stelle.
 * Die Schlüssel kommen aus den Konstanten in typen.ts, nie als freier Text.
 */
import { KATEGORIE, ROLLE, STATUS } from './typen.js';

/** Status, wie ihn die Oberfläche anzeigt. */
export const STATUS_TEXT = {
  [STATUS.ERFASST]: 'Erfasst',
  [STATUS.EINGEREICHT]: 'Eingereicht',
  [STATUS.ZURUECKGEWIESEN]: 'Zurückgewiesen',
  [STATUS.GENEHMIGT]: 'Genehmigt',
  [STATUS.AUSBEZAHLT]: 'Ausbezahlt',
  [STATUS.ABGELEHNT]: 'Abgelehnt',
};

/** Rolle, wie sie die Oberfläche anzeigt. */
export const ROLLE_TEXT = {
  [ROLLE.MITARBEITENDE]: 'Mitarbeitende',
  [ROLLE.VORGESETZTE]: 'Vorgesetzte',
  [ROLLE.LOHNBUCHHALTUNG]: 'Lohnbuchhaltung',
};

/** Kategorie, wie sie die Oberfläche anzeigt. */
export const KATEGORIE_TEXT = {
  [KATEGORIE.FAHRT]: 'Fahrt',
  [KATEGORIE.VERPFLEGUNG]: 'Verpflegung',
  [KATEGORIE.UEBERNACHTUNG]: 'Übernachtung',
  [KATEGORIE.MATERIAL]: 'Material',
};
