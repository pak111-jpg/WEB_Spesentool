/**
 * Mitarbeitende: Übersicht der eigenen Monatsabrechnungen (MA-4) mit Filter und Sortierung,
 * Hinweis bei zurückgewiesenen Abrechnungen (VG-3) und neuen Monat anlegen.
 */
import * as api from '../api';
import {
  auswahl,
  el,
  jahrFeld,
  meldungsZeile,
  monatAuswahl,
  statusMarke,
  statusOptionen,
} from '../dom';
import { chf, monatName, monatSchluessel, zeitpunktCH } from '../format';
import { feld, fehlerBeimFeld, pruefeFelder } from '../formular';
import { filtern, gleichWennGewaehlt } from '../liste';
import { brauchtKorrektur, summeTotal } from '../regeln';
import { merkeMeldung } from '../rueckmeldung';
import { navigiere } from '../router';
import { ALLE_STATUS, type Antrag } from '../typen';
import { ganzzahlZwischen } from '../validierung';
import {
  sortierbareTabelle,
  type Spalte,
} from '../komponenten/sortier-tabelle';

const SPALTEN: Spalte<Antrag>[] = [
  {
    titel: 'Monat',
    inhalt: (a) =>
      el('a', { href: `#/antraege/${a.id}` }, monatName(a.jahr, a.monat)),
    sortWert: (a) => monatSchluessel(a.jahr, a.monat),
  },
  {
    titel: 'Status',
    inhalt: (a) => statusMarke(a.status),
    sortWert: (a) => ALLE_STATUS.indexOf(a.status),
  },
  {
    titel: 'Positionen',
    inhalt: (a) => String(a.anzahlPositionen),
    sortWert: (a) => a.anzahlPositionen,
    klasse: 'zahl',
  },
  {
    titel: 'Total',
    inhalt: (a) => chf.format(a.total),
    sortWert: (a) => a.total,
    klasse: 'zahl',
  },
  {
    titel: 'Eingereicht am',
    inhalt: (a) => zeitpunktCH(a.eingereichtAm),
    sortWert: (a) => a.eingereichtAm ?? '',
  },
  { titel: 'Begründung', inhalt: (a) => a.begruendung ?? '' },
];

/** VG-3: Benachrichtigung über zurückgewiesene Abrechnungen, die korrigiert werden müssen. */
function benachrichtigungen(antraege: Antrag[]): HTMLElement | null {
  const offen = brauchtKorrektur(antraege);
  if (offen.length === 0) return null;
  const eintraege = offen.map((antrag) =>
    el(
      'li',
      {},
      `Deine Abrechnung ${monatName(antrag.jahr, antrag.monat)} wurde zurückgewiesen. `,
      `Begründung: ${antrag.begruendung ?? '-'} `,
      el('a', { href: `#/antraege/${antrag.id}` }, 'Jetzt korrigieren'),
    ),
  );
  return el(
    'div',
    { className: 'hinweis warnung', role: 'status' },
    el('strong', {}, 'Benachrichtigung'),
    el('ul', {}, ...eintraege),
  );
}

function tabelleZeichnen(box: HTMLElement, antraege: Antrag[]): void {
  if (antraege.length === 0) {
    box.replaceChildren(
      el('p', { className: 'leer' }, 'Keine Abrechnungen für diese Auswahl.'),
    );
    return;
  }
  const summe = `${antraege.length} Abrechnung(en), Total ${chf.format(summeTotal(antraege))}`;
  box.replaceChildren(
    sortierbareTabelle(SPALTEN, antraege, { spalte: 0, richtung: 'ab' }),
    el('p', { className: 'klein' }, summe),
  );
}

function uebersicht(antraege: Antrag[]): HTMLElement {
  if (antraege.length === 0) {
    return el(
      'p',
      { className: 'leer' },
      'Noch keine Abrechnung vorhanden. Lege unten mit «Monat anlegen» den ersten Monat an.',
    );
  }
  const jahre = [...new Set(antraege.map((a) => a.jahr))].map((j) => ({
    wert: String(j),
    text: String(j),
  }));
  const jahr = auswahl('filter-jahr', [
    { wert: '', text: 'Alle Jahre' },
    ...jahre,
  ]);
  const status = auswahl('filter-status', statusOptionen(ALLE_STATUS));
  const box = el('div');
  const aktualisieren = () =>
    tabelleZeichnen(
      box,
      filtern(antraege, [
        gleichWennGewaehlt(jahr.value, (a: Antrag) => a.jahr),
        gleichWennGewaehlt(status.value, (a: Antrag) => a.status),
      ]),
    );
  jahr.addEventListener('change', aktualisieren);
  status.addEventListener('change', aktualisieren);
  aktualisieren();
  const filter = el(
    'form',
    { className: 'formular zeile' },
    feld('Jahr', jahr),
    feld('Status', status),
  );
  filter.addEventListener('submit', (e) => e.preventDefault());
  return el('div', {}, filter, box);
}

async function anlegen(
  monat: HTMLSelectElement,
  jahr: HTMLInputElement,
  meldung: HTMLElement,
): Promise<void> {
  if (!pruefeFelder([[jahr, [ganzzahlZwischen(2000, 2100, 'Jahr')]]])) return;
  try {
    const antrag = await api.antraege.erstellen({
      jahr: Number(jahr.value),
      monat: Number(monat.value),
    });
    merkeMeldung(
      `Abrechnung ${monatName(antrag.jahr, antrag.monat)} angelegt. Erfasse jetzt die Positionen.`,
    );
    navigiere(`#/antraege/${antrag.id}`);
  } catch (fehler) {
    // 409: Für diesen Monat gibt es schon eine Abrechnung → Meldung beim Feld Monat
    fehlerBeimFeld(fehler, [[/existiert bereits/, monat]], meldung);
  }
}

function neuKarte(): HTMLElement {
  const heute = new Date();
  const monat = monatAuswahl('f-monat', heute.getMonth() + 1);
  const jahr = jahrFeld('f-jahr', heute.getFullYear());
  const knopf = el('button', { type: 'submit' }, 'Monat anlegen');
  const meldung = meldungsZeile();
  const formular = el(
    'form',
    { className: 'formular zeile', noValidate: true },
    feld('Monat', monat),
    feld('Jahr', jahr),
    knopf,
  );
  formular.addEventListener('submit', (ereignis) => {
    ereignis.preventDefault();
    knopf.disabled = true; // gegen doppeltes Absenden
    void anlegen(monat, jahr, meldung).finally(() => (knopf.disabled = false));
  });
  return el(
    'section',
    { className: 'karte' },
    el('h2', {}, 'Neue Monatsabrechnung'),
    el(
      'p',
      { className: 'klein' },
      'Pro Monat gibt es genau eine Abrechnung. Positionen erfasst du danach in der Abrechnung.',
    ),
    formular,
    meldung,
  );
}

/** Seite «Meine Abrechnungen». */
export async function antraegeListeSeite(): Promise<HTMLElement> {
  const antraege = await api.antraege.meine();
  return el(
    'div',
    { className: 'seite' },
    el(
      'section',
      { className: 'karte' },
      el('h1', {}, 'Meine Abrechnungen'),
      benachrichtigungen(antraege),
      uebersicht(antraege),
    ),
    neuKarte(),
  );
}
