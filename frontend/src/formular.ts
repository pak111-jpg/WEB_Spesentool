/**
 * Formularfelder mit Beschriftung und Fehlermeldung direkt beim Feld.
 * Verbindet die Regeln aus validierung.ts mit der Anzeige: Die Meldung steht unter dem Feld,
 * das Feld ist mit aria-invalid markiert und über aria-describedby mit der Meldung verknüpft.
 */
import { ApiFehler, fehlerText } from './api';
import { el, zeigeMeldung } from './dom';
import { pruefe, type Regel } from './validierung';

type Eingabe = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Ein Feld mit seinen Regeln, für pruefeFelder(). */
export type FeldPruefung = [Eingabe, Regel[]];

/** Eingabefeld mit id, name und type (weitere Eigenschaften optional). */
export function eingabe(
  id: string,
  type: string,
  eigenschaften: Partial<HTMLInputElement> = {},
): HTMLInputElement {
  return el('input', { id, name: id, type, ...eigenschaften });
}

/** Beschriftetes Formularfeld mit Platz für eine Fehlermeldung darunter. */
export function feld(
  beschriftung: string,
  feldEingabe: Eingabe,
): HTMLDivElement {
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
export function feldFehler(feldEingabe: Eingabe, text: string | null): void {
  const ziel = document.getElementById(`${feldEingabe.id}-fehler`);
  if (ziel) ziel.textContent = text ?? '';
  feldEingabe.setAttribute('aria-invalid', text === null ? 'false' : 'true');
}

/**
 * Prüft alle Felder, zeigt die Meldungen beim jeweiligen Feld und setzt den Fokus
 * auf das erste ungültige Feld. Liefert true, wenn alles gültig ist.
 */
export function pruefeFelder(pruefungen: FeldPruefung[]): boolean {
  let erstesUngueltiges: Eingabe | null = null;
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
export function fehlerBeimFeld(
  fehler: unknown,
  zuordnung: [RegExp, Eingabe][],
  meldung: HTMLElement,
): void {
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
