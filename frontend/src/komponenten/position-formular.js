/**
 * Formular für eine neue oder bestehende Position (MA-1, MA-2, MA-5).
 * Bei FAHRT zeigt es ein Kilometerfeld mit Vorschau; den Betrag rechnet das Backend.
 * Jede Eingabe wird vor dem Senden geprüft, Fehler erscheinen direkt beim Feld.
 */
import * as api from '../api.js';
import { auswahl, el, meldungsZeile } from '../dom.js';
import { chf, heuteIso, monatsGrenzen } from '../format.js';
import {
  eingabe,
  feld,
  feldFehler,
  fehlerBeimFeld,
  pruefeFelder,
} from '../formular.js';
import { merkeMeldung } from '../rueckmeldung.js';
import { neuLaden } from '../router.js';
import { KATEGORIE_TEXT } from '../texte.js';
import { ALLE_KATEGORIEN, KATEGORIE } from '../typen.js';
import {
  datumZwischen,
  minLaenge,
  pflicht,
  positiveZahl,
} from '../validierung.js';

/**
 * @typedef {Object} Felder
 * @property {HTMLInputElement} datum
 * @property {HTMLSelectElement} kategorie
 * @property {HTMLInputElement} zweck
 * @property {HTMLInputElement} kilometer
 * @property {HTMLInputElement} betrag
 * @property {HTMLDivElement} kilometerFeld
 * @property {HTMLDivElement} betragFeld
 * @property {HTMLParagraphElement} vorschau
 * @property {HTMLHeadingElement} titel
 * @property {HTMLButtonElement} speichern
 * @property {HTMLButtonElement} abbrechen
 * @property {HTMLParagraphElement} meldung
 */

/**
 * @typedef {Object} Zustand
 * @property {Felder} felder
 * @property {number} antragId
 * @property {{ von: string; bis: string }} grenzen
 * @property {number} pauschale
 * @property {Position | null} bearbeitet null heisst: neue Position
 */

/**
 * Ergebnis: die Karte mit dem Formular und eine Funktion, die eine Position zum Bearbeiten lädt.
 * @typedef {Object} PositionFormular
 * @property {HTMLElement} karte
 * @property {(position: Position) => void} bearbeiten
 */

function kategorieAuswahl() {
  const optionen = ALLE_KATEGORIEN.map((k) => ({
    wert: k,
    text: KATEGORIE_TEXT[k],
  }));
  return auswahl('f-kategorie', optionen);
}

function felderErstellen(z) {
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
function umschalten(z) {
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
function fuellen(z, position) {
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

function pruefungen(z) {
  const f = z.felder;
  const liste = [
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

function eingabeDaten(f) {
  const daten = {
    datum: f.datum.value,
    kategorie: f.kategorie.value,
    zweck: f.zweck.value.trim(),
  };
  if (daten.kategorie === KATEGORIE.FAHRT)
    daten.kilometer = Number(f.kilometer.value);
  else daten.betrag = Number(f.betrag.value);
  return daten;
}

async function speichern(z) {
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
    const zuordnung = [
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
function formularBauen(z) {
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
export function positionFormular(antrag, pauschale) {
  const basis = {
    antragId: antrag.id,
    grenzen: monatsGrenzen(antrag.jahr, antrag.monat),
    pauschale,
  };
  const z = {
    ...basis,
    felder: felderErstellen(basis),
    bearbeitet: null,
  };
  const formular = formularBauen(z);
  fuellen(z, null);
  const bearbeiten = (position) => {
    fuellen(z, position);
    formular.scrollIntoView({ behavior: 'smooth' });
    z.felder.zweck.focus();
  };
  return {
    karte: el('section', { className: 'karte' }, z.felder.titel, formular),
    bearbeiten,
  };
}
