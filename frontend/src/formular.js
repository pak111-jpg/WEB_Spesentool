/**
 * Formularfelder mit Beschriftung und Fehlermeldung direkt beim Feld.
 * Verbindet die Regeln aus validierung.ts mit der Anzeige: Die Meldung steht unter dem Feld,
 * das Feld ist mit aria-invalid markiert und über aria-describedby mit der Meldung verknüpft.
 */
import { ApiFehler, fehlerText } from './api.js';
import { el, zeigeMeldung } from './dom.js';
import { pruefe } from './validierung.js';

/**
 * @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} Eingabe
 */

/**
 * Ein Feld mit seinen Regeln, für pruefeFelder().
 * @typedef {[Eingabe, Regel[]]} FeldPruefung
 */

/** Eingabefeld mit id, name und type (weitere Eigenschaften optional). */
export function eingabe(id, type, eigenschaften = {}) {
  return el('input', { id, name: id, type, ...eigenschaften });
}

/** Beschriftetes Formularfeld mit Platz für eine Fehlermeldung darunter. */
export function feld(beschriftung, feldEingabe) {
  const fehler = el('p', {
    id: `${feldEingabe.id}-fehler`,
    className: 'feld-fehler',
  });
  feldEingabe.setAttribute('aria-describedby', fehler.id);
  return el(
    'div',
    { className: 'feld' },
    el('label', { htmlFor: feldEingabe.id }, beschriftung),
    feldEingabe,
    fehler,
  );
}

/** Zeigt (oder entfernt mit null) die Fehlermeldung beim Feld. */
export function feldFehler(feldEingabe, text) {
  const ziel = document.getElementById(`${feldEingabe.id}-fehler`);
  if (ziel) ziel.textContent = text ?? '';
  feldEingabe.setAttribute('aria-invalid', text === null ? 'false' : 'true');
}

/**
 * Prüft alle Felder, zeigt die Meldungen beim jeweiligen Feld und setzt den Fokus
 * auf das erste ungültige Feld. Liefert true, wenn alles gültig ist.
 */
export function pruefeFelder(pruefungen) {
  let erstesUngueltiges = null;
  for (const [feldEingabe, regeln] of pruefungen) {
    const fehler = pruefe(feldEingabe.value, regeln);
    feldFehler(feldEingabe, fehler);
    if (fehler !== null && erstesUngueltiges === null) {
      erstesUngueltiges = feldEingabe;
    }
  }
  erstesUngueltiges?.focus();
  return erstesUngueltiges === null;
}

/**
 * Zeigt einen Fehler vom Backend beim passenden Feld. Die Zuordnung prüft, welches Stichwort
 * in der Meldung vorkommt (z. B. «Datum»). Passt keines, erscheint die Meldung in `meldung`.
 */
export function fehlerBeimFeld(fehler, zuordnung, meldung) {
  const text = fehlerText(fehler);
  const treffer = zuordnung.find(([muster]) => muster.test(text));
  if (fehler instanceof ApiFehler && treffer) {
    feldFehler(treffer[1], text);
    treffer[1].focus();
    zeigeMeldung(meldung, '');
    return;
  }
  zeigeMeldung(meldung, text, 'fehler');
}
