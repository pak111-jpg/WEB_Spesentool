/**
 * Anmeldeseite. Nach dem Login landet jede Rolle auf ihrer Startseite.
 */
import * as api from '../api';
import { el, feld, zeigeMeldung } from '../dom';
import { navigiere, STARTSEITE } from '../router';
import { anmelden } from '../session';

// Demo-Personen aus prisma/seed.ts (Passwort überall "passwort")
const DEMO_LOGINS = [
  { email: 'anna.meier@firma.ch', text: 'Anna Meier, Mitarbeitende' },
  { email: 'carla.huber@firma.ch', text: 'Carla Huber, Mitarbeitende' },
  { email: 'beat.keller@firma.ch', text: 'Beat Keller, Vorgesetzter' },
  { email: 'lena.schmid@firma.ch', text: 'Lena Schmid, Lohnbuchhaltung' },
];

export function loginSeite(): HTMLElement {
  const email = el('input', {
    id: 'f-email',
    name: 'email',
    type: 'email',
    required: true,
    autocomplete: 'username',
  });
  const passwort = el('input', {
    id: 'f-passwort',
    name: 'passwort',
    type: 'password',
    required: true,
    minLength: 4,
    autocomplete: 'current-password',
  });
  const knopf = el('button', { type: 'submit' }, 'Anmelden');
  const meldung = el('p', { className: 'meldung', role: 'status' });

  const formular = el(
    'form',
    { className: 'formular' },
    feld('E-Mail', email),
    feld('Passwort', passwort),
    knopf,
    meldung,
  );

  async function absenden(ereignis: SubmitEvent): Promise<void> {
    ereignis.preventDefault();
    knopf.disabled = true;
    try {
      const antwort = await api.auth.login({
        email: email.value.trim(),
        passwort: passwort.value,
      });
      anmelden(antwort);
      navigiere(STARTSEITE[antwort.user.rolle]);
    } catch (fehler) {
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    } finally {
      knopf.disabled = false;
    }
  }
  // "void": wir warten hier bewusst nicht auf das Promise, Fehler fängt absenden() selbst
  formular.onsubmit = (ereignis) => void absenden(ereignis);

  // Knöpfe, die das Formular mit einer Demo-Person füllen
  const demoKnoepfe = DEMO_LOGINS.map((demo) => {
    const demoKnopf = el(
      'button',
      { type: 'button', className: 'leise' },
      demo.text,
    );
    demoKnopf.onclick = () => {
      email.value = demo.email;
      passwort.value = 'passwort';
      passwort.focus();
    };
    return el('li', {}, demoKnopf);
  });

  return el(
    'section',
    { className: 'karte schmal' },
    el('h1', {}, 'Anmelden'),
    formular,
    el(
      'details',
      { className: 'demo' },
      el('summary', {}, 'Demo-Zugänge'),
      el('p', { className: 'klein' }, 'Passwort für alle: passwort'),
      el('ul', {}, ...demoKnoepfe),
    ),
  );
}
