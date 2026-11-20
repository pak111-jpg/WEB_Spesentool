/**
 * Bestätigungen nach einer Aktion (G5.5). Nach jeder Aktion wird die Seite neu gezeichnet,
 * dabei ginge eine Meldung verloren. Darum merkt sich dieses Modul die Meldung, und der Router
 * zeigt sie oben auf der neu gezeichneten Seite an.
 */
import { el } from './dom.js';

/**
 * @typedef {'erfolg' | 'warnung' | 'fehler'} Art
 */

let gemerkt = null;

/** Meldung für die nächste angezeigte Seite merken. */
export function merkeMeldung(text, art = 'erfolg') {
  gemerkt = { text, art };
}

/** Die gemerkte Meldung als Element holen (nur einmal), sonst null. */
export function gemerkteMeldung() {
  if (gemerkt === null) return null;
  const { text, art } = gemerkt;
  gemerkt = null;
  return el('p', { className: `hinweis ${art}`, role: 'status' }, text);
}
