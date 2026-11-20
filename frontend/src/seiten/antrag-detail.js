/**
 * Mitarbeitende: eine Abrechnung mit ihren Positionen und dem Verlauf.
 * Solange sie ERFASST oder ZURUECKGEWIESEN ist, können Positionen erfasst, geändert und
 * gelöscht, Belege hochgeladen und die Abrechnung eingereicht werden (MA-1, MA-2, MA-3, MA-5).
 */
import * as api from '../api.js';
import { el, knopf, meldungsZeile, zeigeMeldung } from '../dom.js';
import { monatName } from '../format.js';
import {
  antragKopf,
  positionenTabelle,
  verlaufKarte,
} from '../komponenten/antrag-ansicht.js';
import { positionAktionen } from '../komponenten/position-aktionen.js';
import { positionFormular } from '../komponenten/position-formular.js';
import {
  istBearbeitbar,
  kannEinreichen,
  kannLoeschen,
  pruefeVollstaendigkeit,
} from '../regeln.js';
import { merkeMeldung } from '../rueckmeldung.js';
import { navigiere, neuLaden } from '../router.js';

/**
 * @typedef {Object} Ansicht
 * @property {AntragDetail} antrag
 * @property {HTMLElement} tabelleBox
 * @property {HTMLElement} meldung
 * @property {Aktionen} [aktionen]
 */

/** Tabelle (neu) zeichnen, optional mit den Problemen pro Position nach dem Einreichen. */
function tabelleZeichnen(a, probleme = []) {
  a.tabelleBox.replaceChildren(
    positionenTabelle(a.antrag.positionen, a.meldung, a.aktionen, probleme),
  );
}

/** Unvollständige Positionen in der Tabelle markieren und die Meldung zeigen. */
function problemeZeigen(a, probleme) {
  tabelleZeichnen(a, probleme);
  const allgemein = probleme.find((p) => p.positionId === null);
  const text = allgemein
    ? allgemein.fehler.join(', ')
    : 'Die Abrechnung ist unvollständig. Bitte die markierten Positionen ergänzen.';
  zeigeMeldung(a.meldung, text, 'fehler');
}

/** MA-3: Einreichen. Erst im Browser prüfen; das Backend prüft dieselbe Regel nochmals (400). */
async function einreichen(a, knopfEl) {
  const probleme = pruefeVollstaendigkeit(a.antrag.positionen);
  if (probleme.length > 0) return problemeZeigen(a, probleme);
  knopfEl.disabled = true; // gegen doppeltes Absenden
  try {
    await api.antraege.einreichen(a.antrag.id);
    merkeMeldung(
      'Abrechnung eingereicht. Deine vorgesetzte Person sieht sie jetzt in ihrer Liste.',
    );
    await neuLaden();
  } catch (fehler) {
    if (fehler instanceof api.ApiFehler && fehler.probleme.length > 0) {
      problemeZeigen(a, fehler.probleme);
    } else {
      zeigeMeldung(a.meldung, api.fehlerText(fehler), 'fehler');
    }
    knopfEl.disabled = false;
  }
}

async function loeschen(a) {
  if (!confirm('Diese Abrechnung mit allen Positionen löschen?')) return;
  try {
    await api.antraege.loeschen(a.antrag.id);
    merkeMeldung(
      `Abrechnung ${monatName(a.antrag.jahr, a.antrag.monat)} gelöscht.`,
    );
    navigiere('#/antraege');
  } catch (fehler) {
    zeigeMeldung(a.meldung, api.fehlerText(fehler), 'fehler');
  }
}

function antragAktionen(a) {
  const { status } = a.antrag;
  if (!kannEinreichen(status)) {
    return el(
      'p',
      { className: 'klein' },
      'Diese Abrechnung ist eingereicht und kann nicht mehr bearbeitet werden.',
    );
  }
  const einreichenKnopf = knopf(
    'Abrechnung einreichen',
    '',
    () => void einreichen(a, einreichenKnopf),
  );
  return el(
    'div',
    { className: 'knopfzeile' },
    einreichenKnopf,
    kannLoeschen(status) &&
      knopf('Abrechnung löschen', 'sekundaer gefahr', () => void loeschen(a)),
  );
}

/** Seite «Abrechnung» der Mitarbeitenden. */
export async function antragDetailSeite([id]) {
  const [antrag, pauschale] = await Promise.all([
    api.antraege.einer(Number(id)),
    api.positionen.kilometerpauschale(),
  ]);
  const bearbeitbar = istBearbeitbar(antrag.status);
  const a = {
    antrag,
    tabelleBox: el('div'),
    meldung: meldungsZeile(),
  };
  const formular = bearbeitbar
    ? positionFormular(antrag, pauschale.chfProKilometer)
    : null;
  if (formular) a.aktionen = positionAktionen(formular.bearbeiten, a.meldung);
  tabelleZeichnen(a);
  return el(
    'div',
    { className: 'seite' },
    el('a', { href: '#/antraege' }, 'Zurück zu meinen Abrechnungen'),
    el(
      'section',
      { className: 'karte' },
      antragKopf(antrag, false),
      el('h2', {}, 'Positionen'),
      a.tabelleBox,
      a.meldung,
      antragAktionen(a),
    ),
    formular?.karte,
    verlaufKarte(antrag),
  );
}
