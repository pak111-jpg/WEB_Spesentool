/**
 * Kleine Helfer zum Bauen der Oberfläche ohne Framework.
 * Alles entsteht mit createElement und textContent, nie aus HTML-Text,
 * damit Texte aus dem Backend (Zweck, Begründung) nie als HTML gedeutet werden.
 */
import { monatOhneJahr } from './format.js';
import { STATUS_TEXT } from './texte.js';

/**
 * Was als Kind angehängt werden kann; null, undefined und false werden übersprungen.
 * @typedef {Node | string | null | undefined | false} Kind
 */

/**
 * Erzeugt ein Element, setzt Eigenschaften und hängt Kinder an.
 * Beispiel: el('button', { type: 'button', className: 'sekundaer' }, 'Löschen')
 * Strings werden als Text eingefügt, so lassen sich Kinder bedingt anhängen: `bearbeitbar && knopf`.
 */
export function el(tag, eigenschaften = {}, ...kinder) {
  const element = document.createElement(tag);
  Object.assign(element, eigenschaften);
  for (const kind of kinder) {
    if (kind !== null && kind !== undefined && kind !== false)
      element.append(kind);
  }
  return element;
}

/** Knopf mit Text, CSS-Klasse und Klick-Aktion (über addEventListener). */
export function knopf(text, klasse, aktion) {
  const button = el('button', { type: 'button', className: klasse }, text);
  button.addEventListener('click', aktion);
  return button;
}

/** Auswahlliste aus (Wert, Text)-Paaren. */
export function auswahl(id, optionen, gewaehlt) {
  const select = el('select', { id, name: id });
  for (const option of optionen) {
    const selected = option.wert === gewaehlt;
    select.append(el('option', { value: option.wert, selected }, option.text));
  }
  return select;
}

/** Spaltentitel als data-label an jede Zelle hängen; das CSS zeigt ihn in der Kartenansicht. */
export function spaltenBeschriften(zeile, spalten) {
  Array.from(zeile.cells).forEach((zelle, i) =>
    zelle.setAttribute('data-label', spalten[i] ?? ''),
  );
  return zeile;
}

/** Einfache Tabelle mit Kopfzeile; auf schmalen Bildschirmen als Karten (siehe style.css). */
export function tabelle(spalten, zeilen) {
  zeilen.forEach((zeile) => spaltenBeschriften(zeile, spalten));
  const kopf = el(
    'tr',
    {},
    ...spalten.map((titel) => el('th', { scope: 'col' }, titel)),
  );
  return el(
    'div',
    { className: 'tabelle-rahmen' },
    el('table', {}, el('thead', {}, kopf), el('tbody', {}, ...zeilen)),
  );
}

/** Tabellenzelle; Klasse "zahl" macht sie rechtsbündig. */
export function zelle(klasse, ...inhalt) {
  return el('td', { className: klasse }, ...inhalt);
}

/** Meldungszeile setzen. art: '', 'erfolg', 'warnung', 'fehler' */
export function zeigeMeldung(ziel, text, art = '') {
  ziel.textContent = text;
  ziel.className = 'meldung ' + art;
}

/** Leere Meldungszeile, die Screenreader bei Änderungen vorlesen. */
export function meldungsZeile() {
  return el('p', { className: 'meldung', role: 'status' });
}

/** Farbige Status-Marke, Farbe über die CSS-Klasse status-<status>. */
export function statusMarke(status) {
  return el(
    'span',
    { className: `status status-${status.toLowerCase()}` },
    STATUS_TEXT[status],
  );
}

/** Lässt den Browser eine Datei speichern (CSV-Export). */
export function dateiSpeichern(inhalt, dateiname) {
  const url = URL.createObjectURL(inhalt);
  const link = el('a', { href: url, download: dateiname });
  document.body.append(link); // Firefox braucht den Link im Dokument
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // erst freigeben, wenn der Download läuft
}

/** Auswahlliste der zwölf Monate mit deutschen Namen, Werte "1" bis "12". */
export function monatAuswahl(id, gewaehlt) {
  const monate = Array.from({ length: 12 }, (_, i) => ({
    wert: String(i + 1),
    text: monatOhneJahr(i + 1),
  }));
  return auswahl(id, monate, String(gewaehlt));
}

/** Zahlenfeld für das Jahr, vorbelegt. */
export function jahrFeld(id, wert) {
  return el('input', {
    id,
    name: id,
    type: 'number',
    min: '2000',
    max: '2100',
    step: '1',
    required: true,
    value: String(wert),
  });
}

/** Status als Optionen für Auswahllisten, mit «Alle» als erster Option. */
export function statusOptionen(status) {
  return [
    { wert: '', text: 'Alle Status' },
    ...status.map((s) => ({ wert: s, text: STATUS_TEXT[s] })),
  ];
}
