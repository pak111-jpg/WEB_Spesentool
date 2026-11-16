/**
 * Hash-Router: die Adresse nach dem "#" bestimmt die Seite, z. B. #/antraege/3.
 * Ein Hash-Wechsel lädt die Seite nicht neu, der Browser feuert nur "hashchange".
 * Jede Route hat ein Muster (RegExp), eine erlaubte Rolle und eine Funktion, die die Seite baut.
 */
import { fehlerText } from './api';
import { el } from './dom';
import { layoutZeichnen } from './komponenten/layout';
import { aktuelleSession } from './session';
import type { Rolle } from './typen';

/** Eine Seite bekommt die Treffer aus dem Muster (z. B. die ID) und liefert ihr Wurzelelement. */
export type Seite = (parameter: string[]) => HTMLElement | Promise<HTMLElement>;

interface Route {
  muster: RegExp;
  rolle: Rolle | null; // null: nur Anmeldung nötig
  seite: Seite;
}

const routen: Route[] = [];

export function route(muster: RegExp, rolle: Rolle | null, seite: Seite): void {
  routen.push({ muster, rolle, seite });
}

/** Wohin eine Rolle nach der Anmeldung kommt. */
export const STARTSEITE: Record<Rolle, string> = {
  MITARBEITENDE: '#/antraege',
  VORGESETZTE: '#/freigabe',
  LOHNBUCHHALTUNG: '#/lohnbuchhaltung',
};

export function navigiere(hash: string): void {
  location.hash = hash; // löst "hashchange" und damit anzeigen() aus
}

/** Die aktuelle Seite neu laden, z. B. nach dem Speichern. */
export async function neuLaden(): Promise<void> {
  await anzeigen();
}

// Laufnummer der letzten Navigation. Während eine Seite noch lädt, kann schon die nächste
// starten (z. B. 401 führt zur Anmeldung). Dann darf das alte Ergebnis nicht mehr eingesetzt werden.
let navigation = 0;

async function anzeigen(): Promise<void> {
  const nummer = ++navigation;
  const inhalt = document.getElementById('inhalt')!;
  const pfad = location.hash.slice(1) || '/';
  const session = aktuelleSession();

  // Ohne Anmeldung gibt es nur die Login-Seite; angemeldet führt "/" zur Startseite der Rolle
  if (!session && pfad !== '/login') return navigiere('#/login');
  if (session && (pfad === '/' || pfad === '/login'))
    return navigiere(STARTSEITE[session.user.rolle]);

  layoutZeichnen(session);

  // Erste Route, deren Muster auf den Pfad passt
  let gefunden: Route | undefined;
  let treffer: RegExpMatchArray | null = null;
  for (const kandidat of routen) {
    treffer = pfad.match(kandidat.muster);
    if (treffer) {
      gefunden = kandidat;
      break;
    }
  }
  if (!gefunden || !treffer) {
    inhalt.replaceChildren(fehlerSeite('Diese Seite gibt es nicht.'));
    return;
  }
  if (gefunden.rolle && session && session.user.rolle !== gefunden.rolle) {
    return navigiere(STARTSEITE[session.user.rolle]);
  }

  inhalt.setAttribute('aria-busy', 'true');
  try {
    const seite = await gefunden.seite(treffer.slice(1));
    if (nummer === navigation) inhalt.replaceChildren(seite);
  } catch (fehler) {
    if (nummer === navigation)
      inhalt.replaceChildren(fehlerSeite(fehlerText(fehler)));
  } finally {
    inhalt.removeAttribute('aria-busy');
  }
}

function fehlerSeite(text: string): HTMLElement {
  return el(
    'section',
    { className: 'karte schmal' },
    el('h1', {}, 'Fehler'),
    el('p', { className: 'meldung fehler' }, text),
    el('a', { href: '#/' }, 'Zur Startseite'),
  );
}

export function routerStarten(): void {
  window.addEventListener('hashchange', () => void anzeigen());
  void anzeigen();
}
