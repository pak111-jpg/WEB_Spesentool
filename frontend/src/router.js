/**
 * Hash-Router: die Adresse nach dem "#" bestimmt die Seite, z. B. #/antraege/3.
 * Ein Hash-Wechsel lädt die Seite nicht neu, der Browser feuert nur "hashchange".
 * Jede Route hat ein Muster (RegExp), eine erlaubte Rolle und eine Funktion, die die Seite baut.
 */
import { fehlerText } from './api.js';
import { el, knopf } from './dom.js';
import { layoutZeichnen } from './komponenten/layout.js';
import { gemerkteMeldung } from './rueckmeldung.js';
import { aktuelleSession } from './session.js';
import { ROLLE } from './typen.js';

/**
 * Eine Seite bekommt die Treffer aus dem Muster (z. B. die ID) und liefert ihr Wurzelelement.
 * @typedef {(parameter: string[]) => HTMLElement | Promise<HTMLElement>} Seite
 */

/**
 * @typedef {Object} Route
 * @property {RegExp} muster
 * @property {Rolle | null} rolle null: nur Anmeldung nötig
 * @property {Seite} seite Funktion, die die Seite baut
 */

const routen = [];

/** Seite unter einem Muster anmelden (siehe main.ts). */
export function route(muster, rolle, seite) {
  routen.push({ muster, rolle, seite });
}

/** Wohin eine Rolle nach der Anmeldung kommt. */
export const STARTSEITE = {
  [ROLLE.MITARBEITENDE]: '#/antraege',
  [ROLLE.VORGESETZTE]: '#/freigabe',
  [ROLLE.LOHNBUCHHALTUNG]: '#/lohnbuchhaltung',
};

/** Zu einer Seite wechseln; löst "hashchange" und damit anzeigen() aus. */
export function navigiere(hash) {
  location.hash = hash;
}

/** Die aktuelle Seite neu laden, z. B. nach dem Speichern. */
export async function neuLaden() {
  await anzeigen();
}

// Laufnummer der letzten Navigation. Während eine Seite noch lädt, kann schon die nächste
// starten (z. B. 401 führt zur Anmeldung). Dann darf das alte Ergebnis nicht mehr eingesetzt werden.
let navigation = 0;

/** Leitet um, wenn nötig: ohne Anmeldung zum Login, angemeldet von "/" zur Startseite. */
function umleitung(pfad, session) {
  if (!session && pfad !== '/login') return '#/login';
  if (session && (pfad === '/' || pfad === '/login')) {
    return STARTSEITE[session.user.rolle];
  }
  return null;
}

function routeFinden(pfad) {
  for (const kandidat of routen) {
    const treffer = pfad.match(kandidat.muster);
    if (treffer) return { route: kandidat, parameter: treffer.slice(1) };
  }
  return null;
}

/** Fehlerseite mit verständlicher Meldung und der Möglichkeit, es erneut zu versuchen (U4.5). */
function fehlerSeite(text) {
  return el(
    'section',
    { className: 'karte schmal' },
    el('h1', {}, 'Das hat nicht geklappt'),
    el('p', { className: 'hinweis fehler', role: 'alert' }, text),
    el(
      'div',
      { className: 'knopfzeile' },
      knopf('Erneut versuchen', '', () => void anzeigen()),
      el('a', { href: '#/', className: 'knopf sekundaer' }, 'Zur Startseite'),
    ),
  );
}

async function seiteLaden(gefunden, nummer) {
  const inhalt = document.getElementById('inhalt');
  inhalt.setAttribute('aria-busy', 'true');
  try {
    const seite = await gefunden.route.seite(gefunden.parameter);
    const meldung = gemerkteMeldung();
    if (meldung) seite.prepend(meldung);
    if (nummer === navigation) inhalt.replaceChildren(seite);
  } catch (fehler) {
    if (nummer === navigation) {
      inhalt.replaceChildren(fehlerSeite(fehlerText(fehler)));
    }
  } finally {
    inhalt.removeAttribute('aria-busy');
  }
}

async function anzeigen() {
  const nummer = ++navigation;
  const pfad = location.hash.slice(1) || '/';
  const session = aktuelleSession();
  const ziel = umleitung(pfad, session);
  if (ziel) return navigiere(ziel);

  layoutZeichnen(session);
  const gefunden = routeFinden(pfad);
  if (!gefunden) {
    const inhalt = document.getElementById('inhalt');
    inhalt.replaceChildren(fehlerSeite('Diese Seite gibt es nicht.'));
    return;
  }
  if (gefunden.route.rolle && session?.user.rolle !== gefunden.route.rolle) {
    return navigiere(STARTSEITE[session.user.rolle]);
  }
  await seiteLaden(gefunden, nummer);
}

/** Router starten: auf Hash-Wechsel reagieren und die erste Seite anzeigen. */
export function routerStarten() {
  window.addEventListener('hashchange', () => void anzeigen());
  void anzeigen();
}
