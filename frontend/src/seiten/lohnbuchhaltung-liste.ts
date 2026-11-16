/**
 * Lohnbuchhaltung: Abrechnungen eines Monats, CSV-Export (LB-1), Auszahlung (LB-3)
 * und Auswertung pro Kostenstelle (LB-4).
 */
import * as api from '../api';
import {
  ALLE_STATUS_OPTIONEN,
  auswahl,
  chf,
  dateiSpeichern,
  el,
  feld,
  jahrFeld,
  monatAuswahl,
  monatName,
  statusMarke,
  tabelle,
  zeigeMeldung,
  zelle,
} from '../dom';
import type { Antrag, AntragStatus, KostenstellenAuswertung } from '../typen';

export async function lohnbuchhaltungListeSeite(): Promise<HTMLElement> {
  const heute = new Date();
  const monat = monatAuswahl('f-monat', heute.getMonth() + 1);
  const jahr = jahrFeld('f-jahr', heute.getFullYear());
  // Standard des Backends: GENEHMIGT, also bereit zur Auszahlung
  const status = auswahl('f-status', ALLE_STATUS_OPTIONEN, 'GENEHMIGT');
  const meldung = el('p', { className: 'meldung', role: 'status' });
  const listeBox = el('div');
  const auswertungBox = el('div');

  const gewaehlt = () => ({
    jahr: Number(jahr.value),
    monat: Number(monat.value),
  });

  function listeZeichnen(antraege: Antrag[]): void {
    if (antraege.length === 0) {
      listeBox.replaceChildren(
        el('p', { className: 'leer' }, 'Keine Abrechnungen für diese Auswahl.'),
      );
      return;
    }
    const zeilen = antraege.map((antrag) =>
      el(
        'tr',
        {},
        zelle('', antrag.mitarbeitende.personalnummer),
        zelle('', antrag.mitarbeitende.name),
        zelle('', antrag.mitarbeitende.kostenstelle),
        zelle('', monatName(antrag.jahr, antrag.monat)),
        zelle('zahl', String(antrag.anzahlPositionen)),
        zelle('zahl', chf.format(antrag.total)),
        zelle('', statusMarke(antrag.status)),
        zelle(
          '',
          el('a', { href: `#/lohnbuchhaltung/${antrag.id}` }, 'Ansehen'),
        ),
      ),
    );
    listeBox.replaceChildren(
      tabelle(
        [
          'Personalnummer',
          'Name',
          'Kostenstelle',
          'Monat',
          'Positionen',
          'Total',
          'Status',
          '',
        ],
        zeilen,
      ),
    );
  }

  function auswertungZeichnen(eintraege: KostenstellenAuswertung[]): void {
    if (eintraege.length === 0) {
      auswertungBox.replaceChildren(
        el(
          'p',
          { className: 'leer' },
          'Keine genehmigten oder ausbezahlten Spesen in diesem Monat.',
        ),
      );
      return;
    }
    const zeilen = eintraege.map((eintrag) =>
      el(
        'tr',
        {},
        zelle('', eintrag.kostenstelle),
        zelle('zahl', String(eintrag.anzahlAbrechnungen)),
        zelle('zahl', String(eintrag.anzahlPositionen)),
        zelle('zahl', chf.format(eintrag.total)),
      ),
    );
    const total = eintraege.reduce(
      (summe, eintrag) => summe + eintrag.total,
      0,
    );
    zeilen.push(
      el(
        'tr',
        { className: 'summe' },
        zelle('', 'Total'),
        zelle('', ''),
        zelle('', ''),
        zelle('zahl', chf.format(total)),
      ),
    );
    auswertungBox.replaceChildren(
      tabelle(['Kostenstelle', 'Abrechnungen', 'Positionen', 'Total'], zeilen),
    );
  }

  /** Lädt Liste und Auswertung für die aktuelle Auswahl neu. */
  async function laden(): Promise<void> {
    const { jahr, monat } = gewaehlt();
    try {
      const [antraege, auswertung] = await Promise.all([
        api.lohnbuchhaltung.abrechnungen({
          jahr,
          monat,
          status: status.value as AntragStatus,
        }),
        api.lohnbuchhaltung.auswertung(jahr, monat),
      ]);
      listeZeichnen(antraege);
      auswertungZeichnen(auswertung);
    } catch (fehler) {
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    }
  }
  monat.onchange = jahr.onchange = status.onchange = () => void laden();
  await laden();

  // ---------- Aktionen für den Monat ----------
  const exportieren = el(
    'button',
    { type: 'button', className: 'sekundaer' },
    'CSV exportieren',
  );
  exportieren.onclick = () => {
    const { jahr, monat } = gewaehlt();
    api.lohnbuchhaltung
      .exportCsv(jahr, monat)
      // Dateiname wie im Backend: spesen-JJJJ-MM.csv
      .then((csv) =>
        dateiSpeichern(
          csv,
          `spesen-${jahr}-${String(monat).padStart(2, '0')}.csv`,
        ),
      )
      .catch((fehler: unknown) =>
        zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler'),
      );
  };

  const ausbezahlen = el(
    'button',
    { type: 'button' },
    'Genehmigte als ausbezahlt markieren',
  );
  ausbezahlen.onclick = () => {
    const { jahr, monat } = gewaehlt();
    if (
      !confirm(
        `Alle genehmigten Abrechnungen für ${monatName(jahr, monat)} als ausbezahlt markieren?`,
      )
    )
      return;
    api.lohnbuchhaltung
      .monatAusbezahlt(jahr, monat)
      .then((ergebnis) => {
        zeigeMeldung(
          meldung,
          `${ergebnis.anzahl} Abrechnung(en) als ausbezahlt markiert.`,
          'erfolg',
        );
        return laden();
      })
      .catch((fehler: unknown) =>
        zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler'),
      );
  };

  const filter = el(
    'form',
    { className: 'formular zeile' },
    feld('Monat', monat),
    feld('Jahr', jahr),
    feld('Status', status),
  );
  filter.onsubmit = (ereignis) => ereignis.preventDefault();

  return el(
    'div',
    { className: 'seite' },
    el(
      'section',
      { className: 'karte' },
      el('h1', {}, 'Abrechnungen'),
      filter,
      listeBox,
      el('div', { className: 'knopfzeile' }, exportieren, ausbezahlen),
      meldung,
    ),
    el(
      'section',
      { className: 'karte' },
      el('h2', {}, 'Spesen pro Kostenstelle'),
      el(
        'p',
        { className: 'klein' },
        'Genehmigte und ausbezahlte Abrechnungen des gewählten Monats.',
      ),
      auswertungBox,
    ),
  );
}
