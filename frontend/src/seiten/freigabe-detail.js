/**
 * Vorgesetzte: Antrag prüfen und entscheiden (VG-2, VG-3).
 * Drei Ausgänge: genehmigen, zurückweisen (Korrektur möglich) oder ablehnen (endgültig).
 * Zurückweisen und Ablehnen brauchen eine Begründung; fehlt sie, steht die Meldung beim Feld.
 */
import * as api from '../api.js';
import { el, knopf, meldungsZeile, zeigeMeldung } from '../dom.js';
import { monatName } from '../format.js';
import { feld, pruefeFelder } from '../formular.js';
import {
  antragKopf,
  positionenTabelle,
  verlaufKarte,
} from '../komponenten/antrag-ansicht.js';
import { kannEntscheiden } from '../regeln.js';
import { merkeMeldung } from '../rueckmeldung.js';
import { neuLaden } from '../router.js';

import { minLaenge, pflicht } from '../validierung.js';

/**
 * @typedef {Object} Entscheid
 * @property {AntragDetail} antrag
 * @property {HTMLTextAreaElement} begruendung
 * @property {HTMLButtonElement[]} knoepfe
 * @property {HTMLElement} meldung
 */

/** Führt einen Entscheid aus; die Knöpfe sind währenddessen gesperrt (kein Doppelklick). */
async function entscheiden(e, aktion, bestaetigung) {
  e.knoepfe.forEach((k) => (k.disabled = true));
  try {
    await aktion();
    merkeMeldung(bestaetigung);
    await neuLaden();
  } catch (fehler) {
    zeigeMeldung(e.meldung, api.fehlerText(fehler), 'fehler');
    e.knoepfe.forEach((k) => (k.disabled = false));
  }
}

function begruendungGueltig(e) {
  return pruefeFelder([
    [e.begruendung, [pflicht('Begründung'), minLaenge(5, 'Die Begründung')]],
  ]);
}

function knoepfeBauen(e) {
  const { id, mitarbeitende } = e.antrag;
  const monat = monatName(e.antrag.jahr, e.antrag.monat);
  const text = () => e.begruendung.value.trim();
  return [
    knopf(
      'Genehmigen',
      '',
      () =>
        void entscheiden(
          e,
          () => api.freigabe.genehmigen(id),
          `Abrechnung ${monat} von ${mitarbeitende.name} genehmigt.`,
        ),
    ),
    knopf('Zurückweisen', 'sekundaer', () => {
      if (begruendungGueltig(e))
        void entscheiden(
          e,
          () => api.freigabe.zurueckweisen(id, text()),
          `Abrechnung zurückgewiesen. ${mitarbeitende.name} wird benachrichtigt und kann korrigieren.`,
        );
    }),
    knopf('Ablehnen', 'sekundaer gefahr', () => {
      if (
        begruendungGueltig(e) &&
        confirm(
          'Endgültig ablehnen? Die Person kann den Antrag danach nicht mehr korrigieren.',
        )
      ) {
        void entscheiden(
          e,
          () => api.freigabe.ablehnen(id, text()),
          `Abrechnung ${monat} abgelehnt.`,
        );
      }
    }),
  ];
}

function entscheidKarte(antrag) {
  const begruendung = el('textarea', {
    id: 'f-begruendung',
    name: 'begruendung',
    rows: 3,
    maxLength: 1000,
    minLength: 5,
  });
  const e = {
    antrag,
    begruendung,
    knoepfe: [],
    meldung: meldungsZeile(),
  };
  e.knoepfe = knoepfeBauen(e);
  return el(
    'section',
    { className: 'karte' },
    el('h2', {}, 'Entscheid'),
    el(
      'p',
      { className: 'klein' },
      'Zurückweisen: die Person korrigiert und reicht denselben Antrag erneut ein. Ablehnen ist endgültig.',
    ),
    feld(
      'Begründung (Pflicht bei Zurückweisen und Ablehnen, mind. 5 Zeichen)',
      begruendung,
    ),
    el('div', { className: 'knopfzeile' }, ...e.knoepfe),
    e.meldung,
  );
}

/** Seite «Antrag prüfen» der Vorgesetzten. */
export async function freigabeDetailSeite([id]) {
  const antrag = await api.freigabe.einer(Number(id));
  const meldung = meldungsZeile();
  return el(
    'div',
    { className: 'seite' },
    el('a', { href: '#/freigabe' }, 'Zurück zur Freigabe'),
    el(
      'section',
      { className: 'karte' },
      antragKopf(antrag, true),
      el('h2', {}, 'Positionen'),
      positionenTabelle(antrag.positionen, meldung),
      meldung,
    ),
    kannEntscheiden(antrag.status) && entscheidKarte(antrag),
    verlaufKarte(antrag),
  );
}
