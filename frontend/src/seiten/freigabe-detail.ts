/**
 * Vorgesetzte: Antrag prüfen und entscheiden (VG-2, VG-3).
 * Drei Ausgänge: genehmigen, zurückweisen (Korrektur möglich) oder ablehnen (endgültig).
 * Zurückweisen und Ablehnen brauchen eine Begründung.
 */
import * as api from '../api';
import { el, feld, zeigeMeldung } from '../dom';
import { antragKopf, positionenTabelle } from '../komponenten/antrag-ansicht';
import { neuLaden } from '../router';
import type { AntragDetail } from '../typen';

export async function freigabeDetailSeite([
  id,
]: string[]): Promise<HTMLElement> {
  const antrag = await api.freigabe.einer(Number(id));
  const meldung = el('p', { className: 'meldung', role: 'status' });

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
    antrag.status === 'EINGEREICHT' && entscheidKarte(antrag),
  );
}

function entscheidKarte(antrag: AntragDetail): HTMLElement {
  const begruendung = el('textarea', {
    id: 'f-begruendung',
    rows: 3,
    maxLength: 1000,
  });
  const meldung = el('p', { className: 'meldung', role: 'status' });
  const genehmigen = el('button', { type: 'button' }, 'Genehmigen');
  const zurueckweisen = el(
    'button',
    { type: 'button', className: 'sekundaer' },
    'Zurückweisen',
  );
  const ablehnen = el(
    'button',
    { type: 'button', className: 'sekundaer gefahr' },
    'Ablehnen',
  );
  const knoepfe = [genehmigen, zurueckweisen, ablehnen];

  async function entscheiden(aktion: () => Promise<unknown>): Promise<void> {
    knoepfe.forEach((knopf) => (knopf.disabled = true));
    try {
      await aktion();
      await neuLaden();
    } catch (fehler) {
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
      knoepfe.forEach((knopf) => (knopf.disabled = false));
    }
  }

  /** Gleiche Regel wie das Backend (BegruendungDto): mindestens 5 Zeichen. */
  function begruendungGueltig(): boolean {
    if (begruendung.value.trim().length >= 5) return true;
    zeigeMeldung(
      meldung,
      'Bitte eine Begründung mit mindestens 5 Zeichen eingeben.',
      'fehler',
    );
    begruendung.focus();
    return false;
  }

  genehmigen.onclick = () =>
    void entscheiden(() => api.freigabe.genehmigen(antrag.id));
  zurueckweisen.onclick = () => {
    if (begruendungGueltig()) {
      void entscheiden(() =>
        api.freigabe.zurueckweisen(antrag.id, begruendung.value.trim()),
      );
    }
  };
  ablehnen.onclick = () => {
    if (
      begruendungGueltig() &&
      confirm(
        'Endgültig ablehnen? Die Person kann den Antrag danach nicht mehr korrigieren.',
      )
    ) {
      void entscheiden(() =>
        api.freigabe.ablehnen(antrag.id, begruendung.value.trim()),
      );
    }
  };

  return el(
    'section',
    { className: 'karte' },
    el('h2', {}, 'Entscheid'),
    el(
      'p',
      { className: 'klein' },
      'Zurückweisen: die Person korrigiert und reicht denselben Antrag erneut ein. Ablehnen ist endgültig.',
    ),
    feld('Begründung (Pflicht bei Zurückweisen und Ablehnen)', begruendung),
    el('div', { className: 'knopfzeile' }, ...knoepfe),
    meldung,
  );
}
