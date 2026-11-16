/**
 * Mitarbeitende: Übersicht der eigenen Monatsabrechnungen (MA-4) und neuen Monat anlegen.
 */
import * as api from '../api';
import {
  chf,
  el,
  feld,
  jahrFeld,
  monatAuswahl,
  monatName,
  statusMarke,
  tabelle,
  zeigeMeldung,
  zeitpunktCH,
  zelle,
} from '../dom';
import { navigiere } from '../router';

export async function antraegeListeSeite(): Promise<HTMLElement> {
  const antraege = await api.antraege.meine();

  const zeilen = antraege.map((antrag) =>
    el(
      'tr',
      {},
      zelle(
        '',
        el(
          'a',
          { href: `#/antraege/${antrag.id}` },
          monatName(antrag.jahr, antrag.monat),
        ),
      ),
      zelle('', statusMarke(antrag.status)),
      zelle('zahl', String(antrag.anzahlPositionen)),
      zelle('zahl', chf.format(antrag.total)),
      zelle('', zeitpunktCH(antrag.eingereichtAm)),
      zelle('', antrag.begruendung ?? ''),
    ),
  );

  const uebersicht = el(
    'section',
    { className: 'karte' },
    el('h1', {}, 'Meine Abrechnungen'),
    antraege.length === 0
      ? el(
          'p',
          { className: 'leer' },
          'Noch keine Abrechnung vorhanden. Lege unten den ersten Monat an.',
        )
      : tabelle(
          [
            'Monat',
            'Status',
            'Positionen',
            'Total',
            'Eingereicht am',
            'Begründung',
          ],
          zeilen,
        ),
  );

  // ---------- Neuen Monat anlegen ----------
  const heute = new Date();
  const monat = monatAuswahl('f-monat', heute.getMonth() + 1);
  const jahr = jahrFeld('f-jahr', heute.getFullYear());
  const knopf = el('button', { type: 'submit' }, 'Monat anlegen');
  const meldung = el('p', { className: 'meldung', role: 'status' });

  async function anlegen(ereignis: SubmitEvent): Promise<void> {
    ereignis.preventDefault();
    knopf.disabled = true;
    try {
      const antrag = await api.antraege.erstellen({
        jahr: Number(jahr.value),
        monat: Number(monat.value),
      });
      navigiere(`#/antraege/${antrag.id}`);
    } catch (fehler) {
      // 409: für diesen Monat gibt es schon einen Antrag
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    } finally {
      knopf.disabled = false;
    }
  }
  const formular = el(
    'form',
    { className: 'formular zeile' },
    feld('Monat', monat),
    feld('Jahr', jahr),
    knopf,
  );
  formular.onsubmit = (ereignis) => void anlegen(ereignis);

  const neu = el(
    'section',
    { className: 'karte' },
    el('h2', {}, 'Neue Monatsabrechnung'),
    el(
      'p',
      { className: 'klein' },
      'Pro Monat gibt es genau eine Abrechnung. Positionen erfasst du danach im Antrag.',
    ),
    formular,
    meldung,
  );

  return el('div', { className: 'seite' }, uebersicht, neu);
}
