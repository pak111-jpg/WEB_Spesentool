/**
 * Lohnbuchhaltung: eine Abrechnung mit Positionen und Belegen einsehen (LB-2)
 * und einzeln als ausbezahlt markieren (LB-3).
 */
import * as api from '../api';
import { el, zeigeMeldung } from '../dom';
import { antragKopf, positionenTabelle } from '../komponenten/antrag-ansicht';
import { neuLaden } from '../router';

export async function lohnbuchhaltungDetailSeite([
  id,
]: string[]): Promise<HTMLElement> {
  const antrag = await api.lohnbuchhaltung.eine(Number(id));
  const meldung = el('p', { className: 'meldung', role: 'status' });

  const ausbezahlt = el(
    'button',
    { type: 'button' },
    'Als ausbezahlt markieren',
  );
  ausbezahlt.onclick = () => {
    ausbezahlt.disabled = true;
    api.lohnbuchhaltung
      .ausbezahlt(antrag.id)
      .then(() => neuLaden())
      .catch((fehler: unknown) => {
        // 409: nicht genehmigt oder bereits ausbezahlt
        zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
        ausbezahlt.disabled = false;
      });
  };

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
      antrag.status === 'GENEHMIGT' &&
        el('div', { className: 'knopfzeile' }, ausbezahlt),
    ),
  );
}
