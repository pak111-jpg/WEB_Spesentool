/**
 * Einstiegspunkt. Hier werden alle Seiten beim Router angemeldet.
 * Muster: Regulärer Ausdruck auf den Pfad nach "#", die erlaubte Rolle und die Seitenfunktion.
 * Gruppen in Klammern (\d+) landen als Parameter bei der Seite.
 */
import { route, routerStarten } from './router.js';
import { antraegeListeSeite } from './seiten/antraege-liste.js';
import { antragDetailSeite } from './seiten/antrag-detail.js';
import { freigabeDetailSeite } from './seiten/freigabe-detail.js';
import { freigabeListeSeite } from './seiten/freigabe-liste.js';
import { loginSeite } from './seiten/login.js';
import { lohnbuchhaltungDetailSeite } from './seiten/lohnbuchhaltung-detail.js';
import { lohnbuchhaltungListeSeite } from './seiten/lohnbuchhaltung-liste.js';
import { ROLLE } from './typen.js';

route(/^\/login$/, null, loginSeite);

// Mitarbeitende
route(/^\/antraege$/, ROLLE.MITARBEITENDE, antraegeListeSeite);
route(/^\/antraege\/(\d+)$/, ROLLE.MITARBEITENDE, antragDetailSeite);

// Vorgesetzte
route(/^\/freigabe$/, ROLLE.VORGESETZTE, freigabeListeSeite);
route(/^\/freigabe\/(\d+)$/, ROLLE.VORGESETZTE, freigabeDetailSeite);

// Lohnbuchhaltung
route(/^\/lohnbuchhaltung$/, ROLLE.LOHNBUCHHALTUNG, lohnbuchhaltungListeSeite);
route(
  /^\/lohnbuchhaltung\/(\d+)$/,
  ROLLE.LOHNBUCHHALTUNG,
  lohnbuchhaltungDetailSeite,
);

routerStarten();
