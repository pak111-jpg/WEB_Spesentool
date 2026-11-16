/**
 * Gemeinsame Bausteine für die Detailansicht eines Antrags.
 * Alle drei Rollen sehen denselben Kopf und dieselbe Positionstabelle,
 * nur die Aktionen daneben unterscheiden sich (werden von der Seite übergeben).
 */
import {
  chf,
  datumCH,
  el,
  KATEGORIE_TEXT,
  monatName,
  statusMarke,
  tabelle,
  zeitpunktCH,
  zelle,
} from '../dom';
import type { AntragDetail, Position, PositionFehler } from '../typen';
import { belegKnopf } from './beleg-dialog';

/** Kopf mit Monat, Status, Total und den Zeitstempeln des Ablaufs. */
export function antragKopf(
  antrag: AntragDetail,
  personZeigen: boolean,
): HTMLElement {
  const fakten: [string, string][] = [
    ['Total', chf.format(antrag.total)],
    ['Positionen', String(antrag.anzahlPositionen)],
    ['Eingereicht am', zeitpunktCH(antrag.eingereichtAm)],
  ];
  if (personZeigen) {
    fakten.unshift(
      [
        'Person',
        `${antrag.mitarbeitende.name} (${antrag.mitarbeitende.personalnummer})`,
      ],
      ['Kostenstelle', antrag.mitarbeitende.kostenstelle],
    );
  }
  if (antrag.entschiedenVon) {
    fakten.push([
      'Entschieden von',
      `${antrag.entschiedenVon.name}, ${zeitpunktCH(antrag.entschiedenAm)}`,
    ]);
  }
  if (antrag.ausbezahltAm)
    fakten.push(['Ausbezahlt am', zeitpunktCH(antrag.ausbezahltAm)]);

  const liste = el('dl', { className: 'fakten' });
  for (const [begriff, wert] of fakten) {
    liste.append(el('dt', {}, begriff), el('dd', {}, wert));
  }

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
    // Begründung der vorgesetzten Person bei Rückweisung oder Ablehnung
    antrag.begruendung &&
      el(
        'div',
        {
          className: `hinweis ${antrag.status === 'ABGELEHNT' ? 'fehler' : 'warnung'}`,
        },
        el('strong', {}, 'Begründung: '),
        antrag.begruendung,
      ),
  );
}

/** Zusätzliche Spalte(n) pro Position, die eine Seite anhängen kann (Bearbeiten, Löschen, Upload). */
export type Aktionen = (position: Position) => Node[];

/**
 * Tabelle aller Positionen. `probleme` markiert Zeilen, die beim Einreichen abgewiesen wurden.
 * `aktionen` liefert die Knöpfe für die letzte Spalte; ohne `aktionen` gibt es keine Spalte.
 */
export function positionenTabelle(
  positionen: Position[],
  meldung: HTMLElement,
  aktionen?: Aktionen,
  probleme: PositionFehler[] = [],
): HTMLElement {
  if (positionen.length === 0) {
    return el('p', { className: 'leer' }, 'Noch keine Positionen erfasst.');
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
  });

  return tabelle(spalten, zeilen);
}
