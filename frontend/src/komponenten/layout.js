/**
 * Kopfzeile: Marke, Navigation nach Rolle, angemeldete Person und Abmelden.
 * Wird vom Router vor jeder Seite neu gezeichnet.
 */
import { el, knopf } from '../dom.js';
import { merkeMeldung } from '../rueckmeldung.js';
import { abmelden } from '../session.js';
import { ROLLE_TEXT } from '../texte.js';
import { ROLLE } from '../typen.js';

const NAVIGATION = {
  [ROLLE.MITARBEITENDE]: [{ hash: '#/antraege', text: 'Meine Abrechnungen' }],
  [ROLLE.VORGESETZTE]: [{ hash: '#/freigabe', text: 'Freigabe' }],
  [ROLLE.LOHNBUCHHALTUNG]: [
    { hash: '#/lohnbuchhaltung', text: 'Abrechnungen' },
  ],
};

function personBereich(session) {
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
export function layoutZeichnen(session) {
  const kopf = document.getElementById('kopf');
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
