/**
 * Tabelle, die sich per Klick auf einen Spaltenkopf sortieren lässt (U3.3).
 * Ein zweiter Klick auf dieselbe Spalte kehrt die Richtung um. Die aktuelle Sortierung
 * steht im Attribut aria-sort, damit Screenreader sie ansagen; das CSS zeigt einen Pfeil.
 */
import { el, knopf, spaltenBeschriften } from '../dom.js';
import { sortieren } from '../liste.js';

/**
 * Beschreibung einer Spalte: Titel, Zelleninhalt und (optional) wonach sortiert wird.
 * @template T
 * @typedef {Object} Spalte
 * @property {string} titel
 * @property {(eintrag: T) => Kind} inhalt
 * @property {SortWert<T>} [sortWert]
 * @property {string} [klasse]
 */

/**
 * Nach welcher Spalte (Index) in welche Richtung sortiert ist.
 * @typedef {Object} Sortierung
 * @property {number} spalte
 * @property {Richtung} richtung
 */

/**
 * @template T
 * @typedef {Object} Zustand
 * @property {Spalte<T>[]} spalten
 * @property {T[]} eintraege
 * @property {Sortierung} sortierung
 * @property {HTMLTableSectionElement} tbody
 * @property {HTMLTableCellElement[]} kopf
 * @property {(eintrag: T) => string} zeilenKlasse
 */

/** Baut die sortierbare Tabelle in einem Rahmen, der bei schmalen Bildschirmen scrollt. */
export function sortierbareTabelle(
  spalten,
  eintraege,
  start,
  zeilenKlasse = () => '',
) {
  const zustand = {
    spalten,
    eintraege,
    sortierung: start,
    tbody: el('tbody'),
    kopf: [],
    zeilenKlasse,
  };
  zustand.kopf = spalten.map((_, i) => kopfzelle(zustand, i));
  zeichnen(zustand);
  const thead = el('thead', {}, el('tr', {}, ...zustand.kopf));
  return el(
    'div',
    { className: 'tabelle-rahmen' },
    el('table', {}, thead, zustand.tbody),
  );
}

function kopfzelle(zustand, index) {
  const spalte = zustand.spalten[index];
  if (!spalte.sortWert) return el('th', { scope: 'col' }, spalte.titel);
  const sortierKnopf = knopf(spalte.titel, 'sortier-knopf', () => {
    const gleicheSpalte = zustand.sortierung.spalte === index;
    const umkehren = gleicheSpalte && zustand.sortierung.richtung === 'auf';
    zustand.sortierung = { spalte: index, richtung: umkehren ? 'ab' : 'auf' };
    zeichnen(zustand);
  });
  return el(
    'th',
    { scope: 'col', className: spalte.klasse ?? '' },
    sortierKnopf,
  );
}

function zeichnen(zustand) {
  const { spalten, sortierung } = zustand;
  const sortWert = spalten[sortierung.spalte]?.sortWert;
  const sortiert = sortWert
    ? sortieren(zustand.eintraege, sortWert, sortierung.richtung)
    : zustand.eintraege;
  zustand.tbody.replaceChildren(...sortiert.map((e) => zeile(zustand, e)));
  zustand.kopf.forEach((th, i) => {
    const richtung = sortierung.richtung === 'auf' ? 'ascending' : 'descending';
    th.setAttribute('aria-sort', i === sortierung.spalte ? richtung : 'none');
  });
}

function zeile(zustand, eintrag) {
  const zellen = zustand.spalten.map((spalte) =>
    el('td', { className: spalte.klasse ?? '' }, spalte.inhalt(eintrag)),
  );
  const tr = el('tr', { className: zustand.zeilenKlasse(eintrag) }, ...zellen);
  return spaltenBeschriften(
    tr,
    zustand.spalten.map((s) => s.titel),
  );
}
