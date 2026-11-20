/**
 * Tabelle, die sich per Klick auf einen Spaltenkopf sortieren lässt (U3.3).
 * Ein zweiter Klick auf dieselbe Spalte kehrt die Richtung um. Die aktuelle Sortierung
 * steht im Attribut aria-sort, damit Screenreader sie ansagen; das CSS zeigt einen Pfeil.
 */
import { el, knopf, spaltenBeschriften, type Kind } from '../dom';
import { sortieren, type Richtung, type SortWert } from '../liste';

/** Beschreibung einer Spalte: Titel, Zelleninhalt und (optional) wonach sortiert wird. */
export interface Spalte<T> {
  titel: string;
  inhalt: (eintrag: T) => Kind;
  sortWert?: SortWert<T>;
  klasse?: string;
}

/** Nach welcher Spalte (Index) in welche Richtung sortiert ist. */
export interface Sortierung {
  spalte: number;
  richtung: Richtung;
}

interface Zustand<T> {
  spalten: Spalte<T>[];
  eintraege: T[];
  sortierung: Sortierung;
  tbody: HTMLTableSectionElement;
  kopf: HTMLTableCellElement[];
  zeilenKlasse: (eintrag: T) => string;
}

/** Baut die sortierbare Tabelle in einem Rahmen, der bei schmalen Bildschirmen scrollt. */
export function sortierbareTabelle<T>(
  spalten: Spalte<T>[],
  eintraege: T[],
  start: Sortierung,
  zeilenKlasse: (eintrag: T) => string = () => '',
): HTMLDivElement {
  const zustand: Zustand<T> = {
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

function kopfzelle<T>(
  zustand: Zustand<T>,
  index: number,
): HTMLTableCellElement {
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

function zeichnen<T>(zustand: Zustand<T>): void {
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

function zeile<T>(zustand: Zustand<T>, eintrag: T): HTMLTableRowElement {
  const zellen = zustand.spalten.map((spalte) =>
    el('td', { className: spalte.klasse ?? '' }, spalte.inhalt(eintrag)),
  );
  const tr = el('tr', { className: zustand.zeilenKlasse(eintrag) }, ...zellen);
  return spaltenBeschriften(
    tr,
    zustand.spalten.map((s) => s.titel),
  );
}
