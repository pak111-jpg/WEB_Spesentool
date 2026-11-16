/**
 * Kopfzeile: Marke, Navigation nach Rolle, angemeldete Person und Abmelden.
 * Wird vom Router vor jeder Seite neu gezeichnet.
 */
import { el } from '../dom';
import { abmelden, type Session } from '../session';
import type { Rolle } from '../typen';

const ROLLE_TEXT: Record<Rolle, string> = {
  MITARBEITENDE: 'Mitarbeitende',
  VORGESETZTE: 'Vorgesetzte',
  LOHNBUCHHALTUNG: 'Lohnbuchhaltung',
};

const NAVIGATION: Record<Rolle, { hash: string; text: string }[]> = {
  MITARBEITENDE: [{ hash: '#/antraege', text: 'Meine Abrechnungen' }],
  VORGESETZTE: [{ hash: '#/freigabe', text: 'Freigabe' }],
  LOHNBUCHHALTUNG: [{ hash: '#/lohnbuchhaltung', text: 'Abrechnungen' }],
};

export function layoutZeichnen(session: Session | null): void {
  const kopf = document.getElementById('kopf')!;
  const marke = el('a', { className: 'marke', href: '#/' }, 'Spesenportal');

  if (!session) {
    kopf.replaceChildren(marke);
    return;
  }

  const links = NAVIGATION[session.user.rolle].map((eintrag) =>
    el('li', {}, el('a', { href: eintrag.hash }, eintrag.text)),
  );
  const navigation = el(
    'nav',
    { ariaLabel: 'Hauptnavigation' },
    el('ul', {}, ...links),
  );

  const abmeldeKnopf = el(
    'button',
    { type: 'button', className: 'leise' },
    'Abmelden',
  );
  abmeldeKnopf.onclick = () => {
    abmelden();
    location.hash = '#/login';
  };
  const person = el(
    'div',
    { className: 'person' },
    el('span', {}, session.user.name),
    el('span', { className: 'klein' }, ROLLE_TEXT[session.user.rolle]),
    abmeldeKnopf,
  );

  kopf.replaceChildren(marke, navigation, person);
}
