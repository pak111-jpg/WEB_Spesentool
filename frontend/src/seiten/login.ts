/**
 * Anmeldeseite. Nach dem Login landet jede Rolle auf ihrer Startseite.
 */
import * as api from '../api';
import { el, knopf, meldungsZeile, zeigeMeldung } from '../dom';
import { feld, fehlerBeimFeld, pruefeFelder } from '../formular';
import { merkeMeldung } from '../rueckmeldung';
import { navigiere, STARTSEITE } from '../router';
import { anmelden } from '../session';
import { email as emailRegel, pflicht } from '../validierung';

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

interface LoginFelder {
  email: HTMLInputElement;
  passwort: HTMLInputElement;
  knopf: HTMLButtonElement;
  meldung: HTMLElement;
}

async function absenden(felder: LoginFelder): Promise<void> {
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

function demoListe(felder: LoginFelder): HTMLElement {
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
export function loginSeite(): HTMLElement {
  const felder: LoginFelder = {
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
