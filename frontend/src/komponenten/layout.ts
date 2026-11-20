/**
 * Kopfzeile: Marke, Navigation nach Rolle, angemeldete Person und Abmelden.
 * Wird vom Router vor jeder Seite neu gezeichnet.
 */
import { el, knopf } from '../dom';
import { merkeMeldung } from '../rueckmeldung';
import { abmelden, type Session } from '../session';
import { ROLLE_TEXT } from '../texte';
import { ROLLE, type Rolle } from '../typen';

const NAVIGATION: Record<Rolle, { hash: string; text: string }[]> = {
  [ROLLE.MITARBEITENDE]: [{ hash: '#/antraege', text: 'Meine Abrechnungen' }],
  [ROLLE.VORGESETZTE]: [{ hash: '#/freigabe', text: 'Freigabe' }],
  [ROLLE.LOHNBUCHHALTUNG]: [
    { hash: '#/lohnbuchhaltung', text: 'Abrechnungen' },
  ],
};

function personBereich(session: Session): HTMLElement {
  const abmeldeKnopf = knopf('Abmelden', 'leise', () => {
    abmelden();
    merkeMeldung('Du wurdest abgemeldet.');
    location.hash = '#/login';
  });
  return el(
    'div',
    { className: 'person' },
    el('span', {}, session.user.name),
    el('span', { className: 'klein' }, ROLLE_TEXT[session.user.rolle]),
    abmeldeKnopf,
  );
}

/** Kopfzeile neu zeichnen; ohne Session nur mit der Marke. */
export function layoutZeichnen(session: Session | null): void {
  const kopf = document.getElementById('kopf')!;
  const marke = el('a', { className: 'marke', href: '#/' }, 'Spesenportal');
  if (!session) {
    kopf.replaceChildren(marke);
    return;
  }
  const aktuell = location.hash;
  const links = NAVIGATION[session.user.rolle].map((eintrag) => {
    const link = el('a', { href: eintrag.hash }, eintrag.text);
    if (aktuell.startsWith(eintrag.hash))
      link.setAttribute('aria-current', 'page');
    return el('li', {}, link);
  });
  const navigation = el(
    'nav',
    { ariaLabel: 'Hauptnavigation' },
    el('ul', {}, ...links),
  );
  kopf.replaceChildren(marke, navigation, personBereich(session));
}
