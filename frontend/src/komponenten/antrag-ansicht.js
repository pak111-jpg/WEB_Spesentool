/**
 * Gemeinsame Bausteine für die Detailansicht eines Antrags.
 * Alle drei Rollen sehen denselben Kopf, dieselbe Positionstabelle und denselben Verlauf;
 * nur die Aktionen daneben unterscheiden sich (werden von der Seite übergeben).
 */
import { el, statusMarke, tabelle, zelle } from '../dom.js';
import { chf, datumCH, monatName, zeitpunktCH } from '../format.js';
import { KATEGORIE_TEXT, ROLLE_TEXT, STATUS_TEXT } from '../texte.js';
import { STATUS } from '../typen.js';
import { belegKnopf } from './beleg-dialog.js';

/**
 * Zusätzliche Knöpfe pro Position, die eine Seite anhängen kann (Bearbeiten, Löschen, Upload).
 * @typedef {(position: Position) => Node[]} Aktionen
 */

function fakten(antrag, personZeigen) {
  const liste = [];
  if (personZeigen) {
    const { name, personalnummer, kostenstelle } = antrag.mitarbeitende;
    liste.push(['Person', `${name} (${personalnummer})`]);
    liste.push(['Kostenstelle', kostenstelle]);
  }
  liste.push(['Total', chf.format(antrag.total)]);
  liste.push(['Positionen', String(antrag.anzahlPositionen)]);
  liste.push(['Eingereicht am', zeitpunktCH(antrag.eingereichtAm)]);
  if (antrag.entschiedenVon) {
    const wann = zeitpunktCH(antrag.entschiedenAm);
    liste.push(['Entschieden von', `${antrag.entschiedenVon.name}, ${wann}`]);
  }
  if (antrag.ausbezahltAm) {
    liste.push(['Ausbezahlt am', zeitpunktCH(antrag.ausbezahltAm)]);
  }
  return liste;
}

/** Kopf mit Monat, Status, Total, Zeitstempeln und der Begründung eines Entscheids. */
export function antragKopf(antrag, personZeigen) {
  const liste = el('dl', { className: 'fakten' });
  for (const [begriff, wert] of fakten(antrag, personZeigen)) {
    liste.append(el('dt', {}, begriff), el('dd', {}, wert));
  }
  const artBegruendung =
    antrag.status === STATUS.ABGELEHNT ? 'fehler' : 'warnung';
  return el(
    'div',
    { className: 'antrag-kopf' },
    el(
      'div',
      { className: 'titelzeile' },
      el('h1', {}, `Abrechnung ${monatName(antrag.jahr, antrag.monat)}`),
      statusMarke(antrag.status),
    ),
    liste,
    antrag.begruendung &&
      el(
        'p',
        { className: `hinweis ${artBegruendung}` },
        el('strong', {}, 'Begründung: '),
        antrag.begruendung,
      ),
  );
}

function positionsZeile(position, meldung, fehler, aktionen) {
  const zeile = el(
    'tr',
    { className: fehler.length > 0 ? 'problem' : '' },
    zelle('', datumCH(position.datum)),
    zelle('', KATEGORIE_TEXT[position.kategorie]),
    zelle(
      '',
      position.zweck,
      fehler.length > 0 &&
        el('span', { className: 'klein fehler' }, fehler.join(', ')),
    ),
    zelle(
      'zahl',
      position.kilometer === null ? '-' : `${position.kilometer} km`,
    ),
    zelle('zahl', chf.format(position.betrag)),
    zelle(
      '',
      position.beleg
        ? belegKnopf(position.beleg, meldung)
        : el('span', { className: 'leise' }, 'fehlt'),
    ),
  );
  if (aktionen) {
    zeile.append(
      zelle('', el('div', { className: 'aktionen' }, ...aktionen(position))),
    );
  }
  return zeile;
}

/**
 * Tabelle aller Positionen. `probleme` markiert Zeilen, die beim Einreichen abgewiesen wurden.
 * `aktionen` liefert die Knöpfe für die letzte Spalte; ohne `aktionen` gibt es keine Spalte.
 */
export function positionenTabelle(
  positionen,
  meldung,
  aktionen,
  probleme = [],
) {
  if (positionen.length === 0) {
    return el(
      'p',
      { className: 'leer' },
      'Noch keine Positionen erfasst. Erfasse die erste Position im Formular unten.',
    );
  }
  const spalten = [
    'Datum',
    'Kategorie',
    'Zweck',
    'Kilometer',
    'Betrag',
    'Beleg',
  ];
  if (aktionen) spalten.push('Aktionen');
  const zeilen = positionen.map((position) => {
    const fehler =
      probleme.find((p) => p.positionId === position.id)?.fehler ?? [];
    return positionsZeile(position, meldung, fehler, aktionen);
  });
  return tabelle(spalten, zeilen);
}

function verlaufEintrag(eintrag) {
  const wechsel = eintrag.vonStatus
    ? `${STATUS_TEXT[eintrag.vonStatus]} → ${STATUS_TEXT[eintrag.nachStatus]}`
    : `Angelegt (${STATUS_TEXT[eintrag.nachStatus]})`;
  return el(
    'li',
    {},
    el('time', { dateTime: eintrag.zeitpunkt }, zeitpunktCH(eintrag.zeitpunkt)),
    el('strong', {}, wechsel),
    el(
      'span',
      { className: 'klein' },
      `${eintrag.person.name}, ${ROLLE_TEXT[eintrag.rolle]}`,
    ),
    eintrag.begruendung &&
      el('span', { className: 'klein' }, `Begründung: ${eintrag.begruendung}`),
  );
}

/** U2.4: Verlauf aller Statusänderungen mit Zeitpunkt, Person und Rolle (älteste zuerst). */
export function verlaufKarte(antrag) {
  const inhalt =
    antrag.verlauf.length === 0
      ? el('p', { className: 'leer' }, 'Noch keine Einträge im Verlauf.')
      : el(
          'ol',
          { className: 'verlauf' },
          ...antrag.verlauf.map(verlaufEintrag),
        );
  return el('section', { className: 'karte' }, el('h2', {}, 'Verlauf'), inhalt);
}
