/**
 * Lohnbuchhaltung: eine Abrechnung mit Positionen und Belegen einsehen (LB-2)
 * und einzeln als ausbezahlt markieren (LB-3).
 */
import * as api from '../api';
import { el, knopf, meldungsZeile, zeigeMeldung } from '../dom';
import { monatName } from '../format';
import {
  antragKopf,
  positionenTabelle,
  verlaufKarte,
} from '../komponenten/antrag-ansicht';
import { kannAusbezahlen } from '../regeln';
import { merkeMeldung } from '../rueckmeldung';
import { neuLaden } from '../router';
import type { AntragDetail } from '../typen';

async function ausbezahlen(
  antrag: AntragDetail,
  knopfEl: HTMLButtonElement,
  meldung: HTMLElement,
): Promise<void> {
  knopfEl.disabled = true; // gegen Doppelklick
  try {
    await api.lohnbuchhaltung.ausbezahlt(antrag.id);
    merkeMeldung(
      `Abrechnung ${monatName(antrag.jahr, antrag.monat)} von ${antrag.mitarbeitende.name} als ausbezahlt markiert.`,
    );
    await neuLaden();
  } catch (fehler) {
    // 409: nicht genehmigt oder bereits ausbezahlt
    zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    knopfEl.disabled = false;
  }
}

/** Seite «Abrechnung» der Lohnbuchhaltung. */
export async function lohnbuchhaltungDetailSeite([
  id,
]: string[]): Promise<HTMLElement> {
  const antrag = await api.lohnbuchhaltung.eine(Number(id));
  const meldung = meldungsZeile();
  const ausbezahltKnopf: HTMLButtonElement = knopf(
    'Als ausbezahlt markieren',
    '',
    () => void ausbezahlen(antrag, ausbezahltKnopf, meldung),
  );
  return el(
    'div',
    { className: 'seite' },
    el('a', { href: '#/lohnbuchhaltung' }, 'Zurück zu den Abrechnungen'),
    el(
      'section',
      { className: 'karte' },
      antragKopf(antrag, true),
      el('h2', {}, 'Positionen'),
      positionenTabelle(antrag.positionen, meldung),
      meldung,
      kannAusbezahlen(antrag.status) &&
        el('div', { className: 'knopfzeile' }, ausbezahltKnopf),
    ),
    verlaufKarte(antrag),
  );
}
