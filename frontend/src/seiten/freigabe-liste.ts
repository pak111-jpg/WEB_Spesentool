/**
 * Vorgesetzte: offene Anträge des Teams mit Überfälligkeit (VG-1, VG-4) und die Team-Historie
 * (VG-5), kombiniert filterbar nach Status und Person und sortierbar nach jeder Spalte.
 */
import * as api from '../api';
import {
  auswahl,
  el,
  meldungsZeile,
  statusMarke,
  statusOptionen,
  zeigeMeldung,
} from '../dom';
import { chf, monatName, monatSchluessel, zeitpunktCH } from '../format';
import { eingabe, feld } from '../formular';
import {
  sortierbareTabelle,
  type Spalte,
} from '../komponenten/sortier-tabelle';
import { filtern, gleichWennGewaehlt } from '../liste';
import { summeTotal } from '../regeln';
import {
  ALLE_STATUS,
  FRIST_ARBEITSTAGE,
  STATUS,
  type Antrag,
  type AntragStatus,
  type OffenerAntrag,
} from '../typen';

const PERSON: Spalte<Antrag> = {
  titel: 'Person',
  inhalt: (a) => a.mitarbeitende.name,
  sortWert: (a) => a.mitarbeitende.name,
};
const MONAT: Spalte<Antrag> = {
  titel: 'Monat',
  inhalt: (a) => monatName(a.jahr, a.monat),
  sortWert: (a) => monatSchluessel(a.jahr, a.monat),
};
const TOTAL: Spalte<Antrag> = {
  titel: 'Total',
  inhalt: (a) => chf.format(a.total),
  sortWert: (a) => a.total,
  klasse: 'zahl',
};

const OFFEN_SPALTEN: Spalte<OffenerAntrag>[] = [
  PERSON,
  MONAT,
  TOTAL,
  {
    titel: 'Offen seit',
    sortWert: (a) => a.offenSeitArbeitstagen,
    inhalt: (a) =>
      el(
        'span',
        {},
        `${a.offenSeitArbeitstagen} Arbeitstage`,
        a.ueberfaellig &&
          el('span', { className: 'status status-ueberfaellig' }, 'Überfällig'),
      ),
  },
  {
    titel: 'Aktion',
    inhalt: (a) =>
      el('a', { href: `#/freigabe/${a.id}`, className: 'knopf' }, 'Prüfen'),
  },
];

const TEAM_SPALTEN: Spalte<Antrag>[] = [
  PERSON,
  MONAT,
  {
    titel: 'Status',
    inhalt: (a) => statusMarke(a.status),
    sortWert: (a) => ALLE_STATUS.indexOf(a.status),
  },
  TOTAL,
  {
    titel: 'Entschieden am',
    inhalt: (a) => zeitpunktCH(a.entschiedenAm),
    sortWert: (a) => a.entschiedenAm ?? '',
  },
  {
    titel: 'Aktion',
    inhalt: (a) => el('a', { href: `#/freigabe/${a.id}` }, 'Ansehen'),
  },
];

function offeneZeichnen(
  box: HTMLElement,
  offene: OffenerAntrag[],
  nurUeberfaellig: boolean,
): void {
  const sichtbar = offene.filter((a) => !nurUeberfaellig || a.ueberfaellig);
  const anzahlUeberfaellig = offene.filter((a) => a.ueberfaellig).length;
  const zusammenfassung = `${offene.length} offen, davon ${anzahlUeberfaellig} überfällig (Frist ${FRIST_ARBEITSTAGE} Arbeitstage)`;
  box.replaceChildren(
    sichtbar.length === 0
      ? el(
          'p',
          { className: 'leer' },
          'Keine offenen Anträge. Neue Anträge deines Teams erscheinen hier, sobald sie eingereicht sind.',
        )
      : sortierbareTabelle(
          OFFEN_SPALTEN,
          sichtbar,
          { spalte: 3, richtung: 'ab' },
          (a) => (a.ueberfaellig ? 'ueberfaellig' : ''),
        ),
    el('p', { className: 'klein' }, zusammenfassung),
  );
}

/** VG-1/VG-4: offene Anträge, älteste zuerst; Checkbox zeigt nur überfällige. */
function offeneKarte(offene: OffenerAntrag[]): HTMLElement {
  const nurUeberfaellig = eingabe('f-ueberfaellig', 'checkbox');
  const box = el('div');
  nurUeberfaellig.addEventListener('change', () =>
    offeneZeichnen(box, offene, nurUeberfaellig.checked),
  );
  offeneZeichnen(box, offene, false);
  return el(
    'section',
    { className: 'karte' },
    el('h1', {}, 'Offene Anträge'),
    el(
      'div',
      { className: 'feld-inline' },
      nurUeberfaellig,
      el(
        'label',
        { htmlFor: nurUeberfaellig.id },
        `Nur überfällige (mehr als ${FRIST_ARBEITSTAGE} Arbeitstage)`,
      ),
    ),
    box,
  );
}

function teamZeichnen(
  box: HTMLElement,
  antraege: Antrag[],
  person: string,
): void {
  const sichtbar = filtern(antraege, [
    gleichWennGewaehlt(person, (a: Antrag) => a.mitarbeitende.name),
  ]);
  box.replaceChildren(
    sichtbar.length === 0
      ? el('p', { className: 'leer' }, 'Keine Anträge für diese Auswahl.')
      : sortierbareTabelle(TEAM_SPALTEN, sichtbar, {
          spalte: 1,
          richtung: 'ab',
        }),
    el(
      'p',
      { className: 'klein' },
      `${sichtbar.length} Antrag/Anträge, Total ${chf.format(summeTotal(sichtbar))}`,
    ),
  );
}

function personAuswahl(team: Antrag[]): HTMLSelectElement {
  const namen = [...new Set(team.map((a) => a.mitarbeitende.name))].sort();
  return auswahl('filter-person', [
    { wert: '', text: 'Alle Personen' },
    ...namen.map((n) => ({ wert: n, text: n })),
  ]);
}

/** VG-5: Team-Historie; Status filtert das Backend, Person der Browser (kombiniert). */
function teamKarte(team: Antrag[]): HTMLElement {
  let antraege = team;
  const sichtbareStatus = ALLE_STATUS.filter((s) => s !== STATUS.ERFASST);
  const status = auswahl('filter-status', statusOptionen(sichtbareStatus));
  const person = personAuswahl(team);
  const box = el('div');
  const meldung = meldungsZeile();
  const statusLaden = async () => {
    box.replaceChildren(el('p', { className: 'leer' }, 'Wird geladen …'));
    try {
      antraege = await api.freigabe.team(
        (status.value || undefined) as AntragStatus | undefined,
      );
      teamZeichnen(box, antraege, person.value);
    } catch (fehler) {
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    }
  };
  status.addEventListener('change', () => void statusLaden());
  person.addEventListener('change', () =>
    teamZeichnen(box, antraege, person.value),
  );
  teamZeichnen(box, antraege, '');
  const filter = el(
    'form',
    { className: 'formular zeile' },
    feld('Status', status),
    feld('Person', person),
  );
  filter.addEventListener('submit', (e) => e.preventDefault());
  return el(
    'section',
    { className: 'karte' },
    el('h2', {}, 'Team-Historie'),
    filter,
    box,
    meldung,
  );
}

/** Seite «Freigabe» der Vorgesetzten. */
export async function freigabeListeSeite(): Promise<HTMLElement> {
  const [offene, team] = await Promise.all([
    api.freigabe.offene(),
    api.freigabe.team(),
  ]);
  return el(
    'div',
    { className: 'seite' },
    offeneKarte(offene),
    teamKarte(team),
  );
}
