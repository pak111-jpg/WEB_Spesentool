/**
 * Anmeldeseite. Nach dem Login landet jede Rolle auf ihrer Startseite.
 */
import * as api from '../api.js';
import { el, knopf, meldungsZeile, zeigeMeldung } from '../dom.js';
import { feld, fehlerBeimFeld, pruefeFelder } from '../formular.js';
import { merkeMeldung } from '../rueckmeldung.js';
import { navigiere, STARTSEITE } from '../router.js';
import { anmelden } from '../session.js';
import { email as emailRegel, pflicht } from '../validierung.js';

// Demo-Personen aus backend/prisma/seed-daten.ts (Passwort überall "passwort")
const DEMO_LOGINS = [
  { email: 'anna.meier@firma.ch', text: 'Anna Meier, Mitarbeitende' },
  {
    email: 'eva.brunner@firma.ch',
    text: 'Eva Brunner, Mitarbeitende (zurückgewiesen)',
  },
  { email: 'beat.keller@firma.ch', text: 'Beat Keller, Vorgesetzter' },
  { email: 'sandra.weber@firma.ch', text: 'Sandra Weber, Vorgesetzte' },
  { email: 'lena.schmid@firma.ch', text: 'Lena Schmid, Lohnbuchhaltung' },
];

/**
 * @typedef {Object} LoginFelder
 * @property {HTMLInputElement} email
 * @property {HTMLInputElement} passwort
 * @property {HTMLButtonElement} knopf
 * @property {HTMLElement} meldung
 */

async function absenden(felder) {
  const gueltig = pruefeFelder([
    [felder.email, [pflicht('E-Mail'), emailRegel()]],
    [felder.passwort, [pflicht('Passwort')]],
  ]);
  if (!gueltig) return;
  felder.knopf.disabled = true;
  zeigeMeldung(felder.meldung, 'Anmeldung läuft …');
  try {
    const antwort = await api.auth.login({
      email: felder.email.value.trim(),
      passwort: felder.passwort.value,
    });
    anmelden(antwort);
    merkeMeldung(`Angemeldet als ${antwort.user.name}.`);
    navigiere(STARTSEITE[antwort.user.rolle]);
  } catch (fehler) {
    // 401 «E-Mail oder Passwort falsch» erscheint beim Feld Passwort, alles andere darunter
    fehlerBeimFeld(
      fehler,
      [[/Passwort falsch/, felder.passwort]],
      felder.meldung,
    );
  } finally {
    felder.knopf.disabled = false;
  }
}

function demoListe(felder) {
  const eintraege = DEMO_LOGINS.map((demo) =>
    el(
      'li',
      {},
      knopf(demo.text, 'leise', () => {
        felder.email.value = demo.email;
        felder.passwort.value = 'passwort';
        felder.knopf.focus();
      }),
    ),
  );
  return el(
    'details',
    { className: 'demo' },
    el('summary', {}, 'Demo-Zugänge'),
    el('p', { className: 'klein' }, 'Passwort für alle: passwort'),
    el('ul', {}, ...eintraege),
  );
}

/** Seite «Anmelden» mit Formular und Demo-Zugängen. */
export function loginSeite() {
  const felder = {
    email: el('input', {
      id: 'f-email',
      name: 'email',
      type: 'email',
      required: true,
      autocomplete: 'username',
    }),
    passwort: el('input', {
      id: 'f-passwort',
      name: 'passwort',
      type: 'password',
      required: true,
      autocomplete: 'current-password',
    }),
    knopf: el('button', { type: 'submit' }, 'Anmelden'),
    meldung: meldungsZeile(),
  };
  const formular = el(
    'form',
    { className: 'formular', noValidate: true },
    feld('E-Mail', felder.email),
    feld('Passwort', felder.passwort),
    felder.knopf,
    felder.meldung,
  );
  formular.addEventListener('submit', (ereignis) => {
    ereignis.preventDefault();
    void absenden(felder);
  });
  return el(
    'section',
    { className: 'karte schmal' },
    el('h1', {}, 'Anmelden'),
    formular,
    demoListe(felder),
  );
}
