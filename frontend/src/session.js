/**
 * Angemeldete Person und JWT im Browser merken.
 * Der Token wird bei jeder API-Anfrage als "Authorization: Bearer <token>" mitgeschickt.
 * localStorage überlebt einen Neustart des Browsers, deshalb bleibt man angemeldet.
 */

const SCHLUESSEL = 'spesenportal.session.v1';

/**
 * Was der Browser nach der Anmeldung speichert.
 * @typedef {Object} Session
 * @property {string} accessToken
 * @property {User} user
 */

/** Session nach erfolgreichem Login speichern. */
export function anmelden(antwort) {
  const session = {
    accessToken: antwort.accessToken,
    user: antwort.user,
  };
  localStorage.setItem(SCHLUESSEL, JSON.stringify(session));
}

/** Session löschen (Abmelden oder Token abgelaufen). */
export function abmelden() {
  localStorage.removeItem(SCHLUESSEL);
}

/** Gespeicherte Session lesen; null, wenn niemand angemeldet ist. */
export function aktuelleSession() {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text === null ? null : JSON.parse(text);
  } catch {
    // Kaputter Inhalt darf die App nicht blockieren: wie abgemeldet behandeln
    return null;
  }
}
