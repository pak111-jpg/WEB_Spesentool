/**
 * Lohnbuchhaltung: Abrechnungen eines Monats, kombiniert filterbar nach Monat, Jahr und Status
 * und sortierbar; CSV-Export (LB-1), Auszahlung des ganzen Monats (LB-5) und Auswertung pro
 * Kostenstelle (LB-4).
 */
import * as api from '../api';
import {
  auswahl,
  dateiSpeichern,
  el,
  jahrFeld,
  knopf,
  meldungsZeile,
  monatAuswahl,
  statusMarke,
  statusOptionen,
  tabelle,
  zeigeMeldung,
  zelle,
} from '../dom';
import { chf, monatName } from '../format';
import { feld, pruefeFelder } from '../formular';
import {
  sortierbareTabelle,
  type Spalte,
} from '../komponenten/sortier-tabelle';
import { summeTotal } from '../regeln';
import {
  STATUS,
  type Antrag,
  type AntragStatus,
  type KostenstellenAuswertung,
} from '../typen';
import { ganzzahlZwischen } from '../validierung';

const SPALTEN: Spalte<Antrag>[] = [
  {
    titel: 'Personalnr.',
    inhalt: (a) => a.mitarbeitende.personalnummer,
    sortWert: (a) => a.mitarbeitende.personalnummer,
  },
  {
    titel: 'Name',
    inhalt: (a) => a.mitarbeitende.name,
    sortWert: (a) => a.mitarbeitende.name,
  },
  {
    titel: 'Kostenstelle',
    inhalt: (a) => a.mitarbeitende.kostenstelle,
    sortWert: (a) => a.mitarbeitende.kostenstelle,
  },
  {
    titel: 'Total',
    inhalt: (a) => chf.format(a.total),
    sortWert: (a) => a.total,
    klasse: 'zahl',
  },
  {
    titel: 'Status',
    inhalt: (a) => statusMarke(a.status),
    sortWert: (a) => a.status,
  },
  {
    titel: 'Aktion',
    inhalt: (a) => el('a', { href: `#/lohnbuchhaltung/${a.id}` }, 'Ansehen'),
  },
];

interface Filter {
  monat: HTMLSelectElement;
  jahr: HTMLInputElement;
  status: HTMLSelectElement;
  liste: HTMLElement;
  auswertung: HTMLElement;
  meldung: HTMLElement;
}

function listeZeichnen(f: Filter, antraege: Antrag[]): void {
  const monat = monatName(Number(f.jahr.value), Number(f.monat.value));
  f.liste.replaceChildren(
    antraege.length === 0
      ? el(
          'p',
          { className: 'leer' },
          `Keine Abrechnungen für ${monat} mit diesem Status.`,
        )
      : sortierbareTabelle(SPALTEN, antraege, { spalte: 0, richtung: 'auf' }),
    el(
      'p',
      { className: 'klein' },
      `${antraege.length} Abrechnung(en), Total ${chf.format(summeTotal(antraege))}`,
    ),
  );
}

/** LB-4: Tabelle pro Kostenstelle mit Summenzeile. */
function auswertungZeichnen(
  f: Filter,
  eintraege: KostenstellenAuswertung[],
): void {
  if (eintraege.length === 0) {
    f.auswertung.replaceChildren(
      el(
        'p',
        { className: 'leer' },
        'Keine genehmigten oder ausbezahlten Spesen in diesem Monat.',
      ),
    );
    return;
  }
  const zeilen = eintraege.map((e) =>
    el(
      'tr',
      {},
      zelle('', e.kostenstelle),
      zelle('zahl', String(e.anzahlAbrechnungen)),
      zelle('zahl', String(e.anzahlPositionen)),
      zelle('zahl', chf.format(e.total)),
    ),
  );
  zeilen.push(
    el(
      'tr',
      { className: 'summe' },
      zelle('', 'Total'),
      zelle('', ''),
      zelle('', ''),
      zelle('zahl', chf.format(summeTotal(eintraege))),
    ),
  );
  f.auswertung.replaceChildren(
    tabelle(['Kostenstelle', 'Abrechnungen', 'Positionen', 'Total'], zeilen),
  );
}

/** Lädt Liste und Auswertung für die aktuelle Auswahl neu (mit Ladeanzeige). */
async function laden(f: Filter): Promise<void> {
  if (!pruefeFelder([[f.jahr, [ganzzahlZwischen(2000, 2100, 'Jahr')]]])) return;
  const jahr = Number(f.jahr.value);
  const monat = Number(f.monat.value);
  f.liste.replaceChildren(el('p', { className: 'leer' }, 'Wird geladen …'));
  try {
    const status = (f.status.value || undefined) as AntragStatus | undefined;
    const [antraege, auswertung] = await Promise.all([
      api.lohnbuchhaltung.abrechnungen({ jahr, monat, status }),
      api.lohnbuchhaltung.auswertung(jahr, monat),
    ]);
    listeZeichnen(f, antraege);
    auswertungZeichnen(f, auswertung);
  } catch (fehler) {
    f.liste.replaceChildren();
    zeigeMeldung(f.meldung, api.fehlerText(fehler), 'fehler');
  }
}

async function exportieren(f: Filter): Promise<void> {
  const jahr = Number(f.jahr.value);
  const monat = Number(f.monat.value);
  const dateiname = `spesen-${jahr}-${String(monat).padStart(2, '0')}.csv`;
  try {
    dateiSpeichern(await api.lohnbuchhaltung.exportCsv(jahr, monat), dateiname);
    zeigeMeldung(
      f.meldung,
      `${dateiname} heruntergeladen (nur genehmigte, noch nicht ausbezahlte Abrechnungen).`,
      'erfolg',
    );
  } catch (fehler) {
    zeigeMeldung(f.meldung, api.fehlerText(fehler), 'fehler');
  }
}

async function ausbezahlen(
  f: Filter,
  knopfEl: HTMLButtonElement,
): Promise<void> {
  const jahr = Number(f.jahr.value);
  const monat = Number(f.monat.value);
  if (
    !confirm(
      `Alle genehmigten Abrechnungen für ${monatName(jahr, monat)} als ausbezahlt markieren?`,
    )
  )
    return;
  knopfEl.disabled = true; // gegen Doppelklick
  try {
    const ergebnis = await api.lohnbuchhaltung.monatAusbezahlt(jahr, monat);
    zeigeMeldung(
      f.meldung,
      `${ergebnis.anzahl} Abrechnung(en) als ausbezahlt markiert.`,
      'erfolg',
    );
    await laden(f);
  } catch (fehler) {
    zeigeMeldung(f.meldung, api.fehlerText(fehler), 'fehler');
  } finally {
    knopfEl.disabled = false;
  }
}

function filterErstellen(): Filter {
  // Standard: Vormonat, denn ausbezahlt wird am Monatsende mit dem Lohn
  const vormonat = new Date();
  vormonat.setDate(1);
  vormonat.setMonth(vormonat.getMonth() - 1);
  const optionen = statusOptionen([STATUS.GENEHMIGT, STATUS.AUSBEZAHLT]);
  return {
    monat: monatAuswahl('f-monat', vormonat.getMonth() + 1),
    jahr: jahrFeld('f-jahr', vormonat.getFullYear()),
    status: auswahl('f-status', optionen, STATUS.GENEHMIGT),
    liste: el('div'),
    auswertung: el('div'),
    meldung: meldungsZeile(),
  };
}

function filterFormular(f: Filter): HTMLFormElement {
  [f.monat, f.jahr, f.status].forEach((e) =>
    e.addEventListener('change', () => void laden(f)),
  );
  const formular = el(
    'form',
    { className: 'formular zeile', noValidate: true },
    feld('Monat', f.monat),
    feld('Jahr', f.jahr),
    feld('Status', f.status),
  );
  formular.addEventListener('submit', (e) => e.preventDefault());
  return formular;
}

function aktionsKnoepfe(f: Filter): HTMLElement {
  const ausbezahlenKnopf: HTMLButtonElement = knopf(
    'Genehmigte als ausbezahlt markieren',
    '',
    () => void ausbezahlen(f, ausbezahlenKnopf),
  );
  const exportKnopf = knopf(
    'CSV exportieren',
    'sekundaer',
    () => void exportieren(f),
  );
  return el('div', { className: 'knopfzeile' }, exportKnopf, ausbezahlenKnopf);
}

/** Seite «Abrechnungen» der Lohnbuchhaltung. */
export async function lohnbuchhaltungListeSeite(): Promise<HTMLElement> {
  const f = filterErstellen();
  const filter = filterFormular(f);
  await laden(f);
  return el(
    'div',
    { className: 'seite' },
    el(
      'section',
      { className: 'karte' },
      el('h1', {}, 'Abrechnungen'),
      filter,
      f.liste,
      aktionsKnoepfe(f),
      f.meldung,
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
      f.auswertung,
    ),
  );
}
