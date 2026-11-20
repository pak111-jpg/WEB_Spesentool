/**
 * Formular für eine neue oder bestehende Position (MA-1, MA-2, MA-5).
 * Bei FAHRT zeigt es ein Kilometerfeld mit Vorschau; den Betrag rechnet das Backend.
 * Jede Eingabe wird vor dem Senden geprüft, Fehler erscheinen direkt beim Feld.
 */
import * as api from '../api';
import { auswahl, el, meldungsZeile } from '../dom';
import { chf, heuteIso, monatsGrenzen } from '../format';
import {
  eingabe,
  feld,
  feldFehler,
  fehlerBeimFeld,
  pruefeFelder,
  type FeldPruefung,
} from '../formular';
import { merkeMeldung } from '../rueckmeldung';
import { neuLaden } from '../router';
import { KATEGORIE_TEXT } from '../texte';
import {
  ALLE_KATEGORIEN,
  KATEGORIE,
  type AntragDetail,
  type Kategorie,
  type Position,
  type PositionEingabe,
} from '../typen';
import {
  datumZwischen,
  minLaenge,
  pflicht,
  positiveZahl,
} from '../validierung';

interface Felder {
  datum: HTMLInputElement;
  kategorie: HTMLSelectElement;
  zweck: HTMLInputElement;
  kilometer: HTMLInputElement;
  betrag: HTMLInputElement;
  kilometerFeld: HTMLDivElement;
  betragFeld: HTMLDivElement;
  vorschau: HTMLParagraphElement;
  titel: HTMLHeadingElement;
  speichern: HTMLButtonElement;
  abbrechen: HTMLButtonElement;
  meldung: HTMLParagraphElement;
}

interface Zustand {
  felder: Felder;
  antragId: number;
  grenzen: { von: string; bis: string };
  pauschale: number;
  bearbeitet: Position | null; // null heisst: neue Position
}

/** Ergebnis: die Karte mit dem Formular und eine Funktion, die eine Position zum Bearbeiten lädt. */
export interface PositionFormular {
  karte: HTMLElement;
  bearbeiten: (position: Position) => void;
}

function kategorieAuswahl(): HTMLSelectElement {
  const optionen = ALLE_KATEGORIEN.map((k) => ({
    wert: k,
    text: KATEGORIE_TEXT[k],
  }));
  return auswahl('f-kategorie', optionen);
}

function felderErstellen(z: Omit<Zustand, 'felder' | 'bearbeitet'>): Felder {
  const kilometer = eingabe('f-kilometer', 'number', {
    min: '0.1',
    step: '0.1',
    inputMode: 'decimal',
  });
  const betrag = eingabe('f-betrag', 'number', {
    min: '0.01',
    step: '0.01',
    inputMode: 'decimal',
  });
  return {
    datum: eingabe('f-datum', 'date', {
      required: true,
      min: z.grenzen.von,
      max: z.grenzen.bis,
    }),
    kategorie: kategorieAuswahl(),
    zweck: eingabe('f-zweck', 'text', { required: true, maxLength: 200 }),
    kilometer,
    betrag,
    kilometerFeld: feld(
      `Kilometer (${chf.format(z.pauschale)} pro km)`,
      kilometer,
    ),
    betragFeld: feld('Betrag in CHF', betrag),
    vorschau: el('p', { className: 'klein', role: 'status' }),
    titel: el('h2', {}, 'Neue Position'),
    speichern: el('button', { type: 'submit' }, 'Position speichern'),
    abbrechen: el(
      'button',
      { type: 'button', className: 'sekundaer' },
      'Abbrechen',
    ),
    meldung: meldungsZeile(),
  };
}

/** MA-2: Bei FAHRT zählen die Kilometer (Vorschau des Betrags), sonst der Betrag. */
function umschalten(z: Zustand): void {
  const f = z.felder;
  const fahrt = f.kategorie.value === KATEGORIE.FAHRT;
  f.kilometerFeld.hidden = !fahrt;
  f.betragFeld.hidden = fahrt;
  f.kilometer.required = fahrt;
  f.betrag.required = !fahrt;
  const km = Number(f.kilometer.value);
  f.vorschau.textContent =
    fahrt && km > 0 ? `Ergibt ${chf.format(km * z.pauschale)}` : '';
}

/** Formular leeren (neue Position) oder mit einer bestehenden Position füllen. */
function fuellen(z: Zustand, position: Position | null): void {
  const f = z.felder;
  const heute = heuteIso();
  const imMonat = heute >= z.grenzen.von && heute <= z.grenzen.bis;
  z.bearbeitet = position;
  f.datum.value = position?.datum ?? (imMonat ? heute : z.grenzen.von);
  f.kategorie.value = position?.kategorie ?? KATEGORIE.VERPFLEGUNG;
  f.zweck.value = position?.zweck ?? '';
  f.kilometer.value = position?.kilometer?.toString() ?? '';
  f.betrag.value =
    position && position.kategorie !== KATEGORIE.FAHRT
      ? String(position.betrag)
      : '';
  f.titel.textContent = position
    ? `Position vom ${position.datum.slice(8, 10)}. bearbeiten`
    : 'Neue Position';
  f.speichern.textContent = position
    ? 'Änderung speichern'
    : 'Position speichern';
  f.abbrechen.hidden = !position;
  [f.datum, f.zweck, f.kilometer, f.betrag].forEach((e) => feldFehler(e, null));
  umschalten(z);
}

function pruefungen(z: Zustand): FeldPruefung[] {
  const f = z.felder;
  const liste: FeldPruefung[] = [
    [f.datum, [datumZwischen(z.grenzen.von, z.grenzen.bis)]],
    [f.zweck, [pflicht('Zweck'), minLaenge(3, 'Zweck')]],
  ];
  if (f.kategorie.value === KATEGORIE.FAHRT) {
    liste.push([f.kilometer, [positiveZahl('Kilometer', 1)]]);
  } else {
    liste.push([f.betrag, [positiveZahl('Betrag', 2)]]);
  }
  return liste;
}

function eingabeDaten(f: Felder): PositionEingabe {
  const daten: PositionEingabe = {
    datum: f.datum.value,
    kategorie: f.kategorie.value as Kategorie,
    zweck: f.zweck.value.trim(),
  };
  if (daten.kategorie === KATEGORIE.FAHRT)
    daten.kilometer = Number(f.kilometer.value);
  else daten.betrag = Number(f.betrag.value);
  return daten;
}

async function speichern(z: Zustand): Promise<void> {
  const f = z.felder;
  if (!pruefeFelder(pruefungen(z))) return;
  f.speichern.disabled = true; // gegen doppeltes Absenden
  try {
    if (z.bearbeitet)
      await api.positionen.aktualisieren(z.bearbeitet.id, eingabeDaten(f));
    else await api.positionen.erstellen(z.antragId, eingabeDaten(f));
    merkeMeldung(
      z.bearbeitet ? 'Änderung gespeichert.' : 'Position gespeichert.',
    );
    await neuLaden();
  } catch (fehler) {
    const zuordnung: [RegExp, HTMLInputElement][] = [
      [/Datum/, f.datum],
      [/Kilometer/, f.kilometer],
      [/Betrag/, f.betrag],
      [/Zweck|zweck/, f.zweck],
    ];
    fehlerBeimFeld(fehler, zuordnung, f.meldung);
  } finally {
    f.speichern.disabled = false;
  }
}

/** Formular mit allen Feldern und den Ereignissen (Absenden, Kategorie, Abbrechen). */
function formularBauen(z: Zustand): HTMLFormElement {
  const f = z.felder;
  const formular = el(
    'form',
    { className: 'formular', noValidate: true },
    feld('Datum', f.datum),
    feld('Kategorie', f.kategorie),
    feld('Zweck', f.zweck),
    f.kilometerFeld,
    f.betragFeld,
    f.vorschau,
    el('div', { className: 'knopfzeile' }, f.speichern, f.abbrechen),
    f.meldung,
  );
  formular.addEventListener('submit', (e) => {
    e.preventDefault();
    void speichern(z);
  });
  f.kategorie.addEventListener('change', () => umschalten(z));
  f.kilometer.addEventListener('input', () => umschalten(z));
  f.abbrechen.addEventListener('click', () => fuellen(z, null));
  return formular;
}

/** Baut das Formular für den Antrag; `pauschale` ist die Kilometerpauschale in CHF. */
export function positionFormular(
  antrag: AntragDetail,
  pauschale: number,
): PositionFormular {
  const basis = {
    antragId: antrag.id,
    grenzen: monatsGrenzen(antrag.jahr, antrag.monat),
    pauschale,
  };
  const z: Zustand = {
    ...basis,
    felder: felderErstellen(basis),
    bearbeitet: null,
  };
  const formular = formularBauen(z);
  fuellen(z, null);
  const bearbeiten = (position: Position) => {
    fuellen(z, position);
    formular.scrollIntoView({ behavior: 'smooth' });
    z.felder.zweck.focus();
  };
  return {
    karte: el('section', { className: 'karte' }, z.felder.titel, formular),
    bearbeiten,
  };
}
