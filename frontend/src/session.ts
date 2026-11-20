/**
 * Angemeldete Person und JWT im Browser merken.
 * Der Token wird bei jeder API-Anfrage als "Authorization: Bearer <token>" mitgeschickt.
 * localStorage überlebt einen Neustart des Browsers, deshalb bleibt man angemeldet.
 */
import type { LoginAntwort, User } from './typen';

const SCHLUESSEL = 'spesenportal.session.v1';

/** Was der Browser nach der Anmeldung speichert. */
export interface Session {
  accessToken: string;
  user: User;
}

/** Session nach erfolgreichem Login speichern. */
export function anmelden(antwort: LoginAntwort): void {
  const session: Session = {
    accessToken: antwort.accessToken,
    user: antwort.user,
  };
  localStorage.setItem(SCHLUESSEL, JSON.stringify(session));
}

/** Session löschen (Abmelden oder Token abgelaufen). */
export function abmelden(): void {
  localStorage.removeItem(SCHLUESSEL);
}

/** Gespeicherte Session lesen; null, wenn niemand angemeldet ist. */
export function aktuelleSession(): Session | null {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text === null ? null : (JSON.parse(text) as Session);
  } catch {
    // Kaputter Inhalt darf die App nicht blockieren: wie abgemeldet behandeln
    return null;
  }
}
