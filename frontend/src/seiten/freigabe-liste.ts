/**
 * Vorgesetzte: offene Anträge des Teams mit Überfälligkeit (VG-1, VG-4) und Team-Historie.
 */
import * as api from '../api';
import {
  ALLE_STATUS_OPTIONEN,
  auswahl,
  chf,
  el,
  monatName,
  statusMarke,
  tabelle,
  zeigeMeldung,
  zeitpunktCH,
  zelle,
} from '../dom';
import type { AntragStatus } from '../typen';

export async function freigabeListeSeite(): Promise<HTMLElement> {
  const [offene, team] = await Promise.all([
    api.freigabe.offene(),
    api.freigabe.team(),
  ]);
  const meldung = el('p', { className: 'meldung', role: 'status' });

  // ---------- Offene Anträge ----------
  const nurUeberfaellig = el('input', {
    id: 'f-ueberfaellig',
    type: 'checkbox',
  });
  const offeneBox = el('div');

  function offeneZeichnen(): void {
    const sichtbar = offene.filter(
      (antrag) => !nurUeberfaellig.checked || antrag.ueberfaellig,
    );
    if (sichtbar.length === 0) {
      offeneBox.replaceChildren(
        el('p', { className: 'leer' }, 'Keine offenen Anträge.'),
      );
      return;
    }
    const zeilen = sichtbar.map((antrag) =>
      el(
        'tr',
        { className: antrag.ueberfaellig ? 'ueberfaellig' : '' },
        zelle(
          '',
          antrag.mitarbeitende.name,
          el('span', { className: 'klein' }, antrag.mitarbeitende.kostenstelle),
        ),
        zelle('', monatName(antrag.jahr, antrag.monat)),
        zelle('zahl', String(antrag.anzahlPositionen)),
        zelle('zahl', chf.format(antrag.total)),
        zelle(
          '',
          `${antrag.offenSeitArbeitstagen} Arbeitstage`,
          antrag.ueberfaellig &&
            el(
              'span',
              { className: 'status status-ueberfaellig' },
              'Überfällig',
            ),
        ),
        zelle(
          '',
          el(
            'a',
            { href: `#/freigabe/${antrag.id}`, className: 'knopf' },
            'Prüfen',
          ),
        ),
      ),
    );
    offeneBox.replaceChildren(
      tabelle(
        ['Person', 'Monat', 'Positionen', 'Total', 'Offen seit', ''],
        zeilen,
      ),
    );
  }
  nurUeberfaellig.onchange = offeneZeichnen;
  offeneZeichnen();

  const offeneKarte = el(
    'section',
    { className: 'karte' },
    el(
      'div',
      { className: 'karte-kopf' },
      el('h1', {}, 'Offene Anträge'),
      el(
        'label',
        { className: 'feld-inline', htmlFor: 'f-ueberfaellig' },
        nurUeberfaellig,
        'Nur überfällige (mehr als 2 Arbeitstage)',
      ),
    ),
    offeneBox,
  );

  // ---------- Team-Historie mit Statusfilter (Abfrage ans Backend) ----------
  const statusFilter = auswahl('f-status', [
    { wert: '', text: 'Alle Status' },
    ...ALLE_STATUS_OPTIONEN,
  ]);
  const teamBox = el('div');

  function teamZeichnen(antraege: typeof team): void {
    if (antraege.length === 0) {
      teamBox.replaceChildren(
        el('p', { className: 'leer' }, 'Keine Anträge mit diesem Status.'),
      );
      return;
    }
    const zeilen = antraege.map((antrag) =>
      el(
        'tr',
        {},
        zelle('', antrag.mitarbeitende.name),
        zelle('', monatName(antrag.jahr, antrag.monat)),
        zelle('', statusMarke(antrag.status)),
        zelle('zahl', chf.format(antrag.total)),
        zelle('', zeitpunktCH(antrag.entschiedenAm)),
        zelle('', el('a', { href: `#/freigabe/${antrag.id}` }, 'Ansehen')),
      ),
    );
    teamBox.replaceChildren(
      tabelle(
        ['Person', 'Monat', 'Status', 'Total', 'Entschieden am', ''],
        zeilen,
      ),
    );
  }
  teamZeichnen(team);

  statusFilter.onchange = () => {
    const status = (statusFilter.value || undefined) as
      AntragStatus | undefined;
    api.freigabe
      .team(status)
      .then(teamZeichnen)
      .catch((fehler: unknown) =>
        zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler'),
      );
  };

  const teamKarte = el(
    'section',
    { className: 'karte' },
    el(
      'div',
      { className: 'karte-kopf' },
      el('h2', {}, 'Team-Historie'),
      statusFilter,
    ),
    teamBox,
    meldung,
  );

  return el('div', { className: 'seite' }, offeneKarte, teamKarte);
}
