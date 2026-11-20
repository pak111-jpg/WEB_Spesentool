/**
 * Zugriff auf das Backend. Eine Funktion pro Endpunkt, gruppiert wie die Module im Backend.
 * Alle Aufrufe laufen über `anfrage()`, das den Token setzt und Fehler einheitlich meldet.
 */
import { abmelden, aktuelleSession } from './session.js';

/** Adresse des Backends. Läuft es auf einem anderen Port, hier anpassen. */
export const API_URL = 'http://localhost:3000';

/** Fehler mit HTTP-Status und der Meldung des Backends. */
export class ApiFehler extends Error {
  /**
   * @param status HTTP-Status (0, wenn gar keine Antwort kam)
   * @param message Meldung des Backends
   * @param probleme Bei "Einreichen" liefert das Backend je Position die fehlenden Angaben.
   */
  constructor(status, message, probleme = []) {
    super(message);
    this.status = status;
    this.probleme = probleme;
  }
}

/** Liefert einen lesbaren Text für beliebige Fehler (API, Netzwerk, Programmfehler). */
export function fehlerText(fehler) {
  if (fehler instanceof Error) return fehler.message;
  return 'Unbekannter Fehler';
}

/**
 * @typedef {Object} Optionen
 * @property {'GET' | 'POST' | 'PATCH' | 'DELETE'} [methode]
 * @property {unknown} [body] wird als JSON geschickt
 * @property {FormData} [formData] für Datei-Uploads (Content-Type setzt der Browser)
 * @property {Record<string, string | number | undefined>} [query] Query-Parameter; leere Werte werden weggelassen
 */

/** Adresse mit Query-Parametern; leere Werte werden weggelassen. */
function urlBauen(pfad, query = {}) {
  const url = new URL(pfad, API_URL);
  for (const [name, wert] of Object.entries(query)) {
    if (wert !== undefined && wert !== '') {
      url.searchParams.set(name, String(wert));
    }
  }
  return url;
}

/** Token der Session und Content-Type für JSON setzen. */
function headersBauen(optionen) {
  const headers = new Headers();
  const session = aktuelleSession();
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (optionen.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

/** fetch mit verständlicher Meldung, wenn gar keine Antwort kommt (Backend aus, kein Netz). */
async function senden(url, optionen) {
  const body =
    optionen.formData ??
    (optionen.body !== undefined ? JSON.stringify(optionen.body) : undefined);
  try {
    return await fetch(url, {
      method: optionen.methode ?? 'GET',
      headers: headersBauen(optionen),
      body,
    });
  } catch {
    throw new ApiFehler(
      0,
      `Das Backend ist nicht erreichbar. Läuft die API auf ${API_URL}? Bitte später erneut versuchen.`,
    );
  }
}

/** Baut die Anfrage, schickt sie ab und wertet die Antwort aus. */
async function anfrage(pfad, optionen = {}) {
  const antwort = await senden(urlBauen(pfad, optionen.query), optionen);
  if (antwort.ok) return antwort;

  // Token abgelaufen oder ungültig: Session löschen und zur Anmeldung
  if (antwort.status === 401 && pfad !== '/auth/login') {
    abmelden();
    location.hash = '#/login';
  }
  throw await alsApiFehler(antwort);
}

/** NestJS liefert Fehler als JSON mit `message` (String oder Liste von Strings). */
async function alsApiFehler(antwort) {
  let message = `HTTP ${antwort.status}`;
  let probleme = [];
  try {
    const daten = await antwort.json();

    if (Array.isArray(daten.message)) message = daten.message.join(', ');
    else if (daten.message) message = daten.message;
    probleme = daten.probleme ?? [];
  } catch {
    // Antwort ohne JSON-Body (z. B. Proxy-Fehler): Status reicht als Meldung
  }
  return new ApiFehler(antwort.status, message, probleme);
}

async function json(pfad, optionen) {
  const antwort = await anfrage(pfad, optionen);
  return await antwort.json();
}

/** Für Endpunkte, die 204 No Content zurückgeben. */
async function ohneInhalt(pfad, optionen) {
  await anfrage(pfad, optionen);
}

/** Dateien (Belege, CSV) müssen mit Token geladen werden, darum nicht einfach per <img src>. */
async function blob(pfad, optionen) {
  const antwort = await anfrage(pfad, optionen);
  return antwort.blob();
}

// ---------- src/auth ----------
/** Anmeldung (src/auth). */
export const auth = {
  login: (daten) => json('/auth/login', { methode: 'POST', body: daten }),
  me: () => json('/auth/me'),
};

// ---------- src/antraege (Rolle MITARBEITENDE) ----------
/** Eigene Anträge der Mitarbeitenden (src/antraege). */
export const antraege = {
  meine: () => json('/antraege'),
  einer: (id) => json(`/antraege/${id}`),
  erstellen: (daten) => json('/antraege', { methode: 'POST', body: daten }),
  loeschen: (id) => ohneInhalt(`/antraege/${id}`, { methode: 'DELETE' }),
  einreichen: (id) => json(`/antraege/${id}/einreichen`, { methode: 'POST' }),
};

// ---------- src/positionen (Rolle MITARBEITENDE) ----------
/** Positionen eines Antrags (src/positionen). */
export const positionen = {
  kilometerpauschale: () => json('/positionen/kilometerpauschale'),
  erstellen: (antragId, daten) =>
    json(`/antraege/${antragId}/positionen`, {
      methode: 'POST',
      body: daten,
    }),
  aktualisieren: (id, daten) =>
    json(`/positionen/${id}`, { methode: 'PATCH', body: daten }),
  loeschen: (id) => ohneInhalt(`/positionen/${id}`, { methode: 'DELETE' }),
};

// ---------- src/belege ----------
/** Belegdateien hoch- und herunterladen (src/belege). */
export const belege = {
  hochladen: (positionId, datei) => {
    const formData = new FormData();
    formData.append('datei', datei); // Feldname wie im FileInterceptor des Backends
    return json(`/positionen/${positionId}/beleg`, {
      methode: 'POST',
      formData,
    });
  },
  laden: (id) => blob(`/belege/${id}`),
  loeschen: (id) => ohneInhalt(`/belege/${id}`, { methode: 'DELETE' }),
};

// ---------- src/freigabe (Rolle VORGESETZTE) ----------
/** Prüfen und Entscheiden durch Vorgesetzte (src/freigabe). */
export const freigabe = {
  offene: () => json('/freigabe/offen'),
  team: (status) => json('/freigabe/antraege', { query: { status } }),
  einer: (id) => json(`/freigabe/antraege/${id}`),
  genehmigen: (id) =>
    json(`/freigabe/antraege/${id}/genehmigen`, {
      methode: 'POST',
    }),
  zurueckweisen: (id, begruendung) =>
    json(`/freigabe/antraege/${id}/zurueckweisen`, {
      methode: 'POST',
      body: { begruendung },
    }),
  ablehnen: (id, begruendung) =>
    json(`/freigabe/antraege/${id}/ablehnen`, {
      methode: 'POST',
      body: { begruendung },
    }),
};

// ---------- src/lohnbuchhaltung (Rolle LOHNBUCHHALTUNG) ----------
/** Export, Auszahlung und Auswertung (src/lohnbuchhaltung). */
export const lohnbuchhaltung = {
  abrechnungen: (filter) =>
    json('/lohnbuchhaltung/abrechnungen', { query: filter }),
  eine: (id) => json(`/lohnbuchhaltung/abrechnungen/${id}`),
  exportCsv: (jahr, monat) =>
    blob('/lohnbuchhaltung/export', { query: { jahr, monat } }),
  ausbezahlt: (id) =>
    json(`/lohnbuchhaltung/abrechnungen/${id}/ausbezahlt`, {
      methode: 'POST',
    }),
  monatAusbezahlt: (jahr, monat) =>
    json('/lohnbuchhaltung/monat/ausbezahlt', {
      methode: 'POST',
      body: { jahr, monat },
    }),
  auswertung: (jahr, monat) =>
    json('/lohnbuchhaltung/auswertung', {
      query: { jahr, monat },
    }),
};
