/**
 * Zugriff auf das Backend. Eine Funktion pro Endpunkt, gruppiert wie die Module im Backend.
 * Alle Aufrufe laufen über `anfrage()`, das den Token setzt und Fehler einheitlich meldet.
 */
import { abmelden, aktuelleSession } from './session';
import type {
  Antrag,
  AntragDetail,
  AntragErstellen,
  AntragStatus,
  AusbezahltErgebnis,
  Beleg,
  KostenstellenAuswertung,
  LoginAntwort,
  LoginDaten,
  OffenerAntrag,
  Position,
  PositionEingabe,
  PositionFehler,
  User,
} from './typen';

// Adresse aus .env (VITE_API_URL), sonst der Standard des Backends
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000';

/** Fehler mit HTTP-Status und der Meldung des Backends. */
export class ApiFehler extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Bei "Einreichen" liefert das Backend je Position die fehlenden Angaben. */
    public readonly probleme: PositionFehler[] = [],
  ) {
    super(message);
  }
}

/** Liefert einen lesbaren Text für beliebige Fehler (API, Netzwerk, Programmfehler). */
export function fehlerText(fehler: unknown): string {
  if (fehler instanceof Error) return fehler.message;
  return 'Unbekannter Fehler';
}

interface Optionen {
  methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown; // wird als JSON geschickt
  formData?: FormData; // für Datei-Uploads (Content-Type setzt der Browser)
  query?: Record<string, string | number | undefined>;
}

/** Baut die Anfrage, schickt sie ab und wertet die Antwort aus. */
async function anfrage(
  pfad: string,
  optionen: Optionen = {},
): Promise<Response> {
  const url = new URL(pfad, API_URL);
  for (const [name, wert] of Object.entries(optionen.query ?? {})) {
    if (wert !== undefined && wert !== '')
      url.searchParams.set(name, String(wert));
  }

  const headers = new Headers();
  const session = aktuelleSession();
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (optionen.body !== undefined)
    headers.set('Content-Type', 'application/json');

  let antwort: Response;
  try {
    antwort = await fetch(url, {
      method: optionen.methode ?? 'GET',
      headers,
      body:
        optionen.formData ??
        (optionen.body !== undefined
          ? JSON.stringify(optionen.body)
          : undefined),
    });
  } catch {
    // fetch wirft nur, wenn gar keine Antwort kam (Backend aus, kein Netz, CORS)
    throw new ApiFehler(
      0,
      `Backend nicht erreichbar. Läuft die API auf ${API_URL}?`,
    );
  }

  if (antwort.ok) return antwort;

  // Token abgelaufen oder ungültig: Session löschen und zur Anmeldung
  if (antwort.status === 401 && pfad !== '/auth/login') {
    abmelden();
    location.hash = '#/login';
  }
  throw await alsApiFehler(antwort);
}

/** NestJS liefert Fehler als JSON mit `message` (String oder Liste von Strings). */
async function alsApiFehler(antwort: Response): Promise<ApiFehler> {
  let message = `HTTP ${antwort.status}`;
  let probleme: PositionFehler[] = [];
  try {
    const daten = (await antwort.json()) as {
      message?: string | string[];
      probleme?: PositionFehler[];
    };
    if (Array.isArray(daten.message)) message = daten.message.join(', ');
    else if (daten.message) message = daten.message;
    probleme = daten.probleme ?? [];
  } catch {
    // Antwort ohne JSON-Body (z. B. Proxy-Fehler): Status reicht als Meldung
  }
  return new ApiFehler(antwort.status, message, probleme);
}

async function json<T>(pfad: string, optionen?: Optionen): Promise<T> {
  const antwort = await anfrage(pfad, optionen);
  return (await antwort.json()) as T;
}

/** Für Endpunkte, die 204 No Content zurückgeben. */
async function ohneInhalt(pfad: string, optionen?: Optionen): Promise<void> {
  await anfrage(pfad, optionen);
}

/** Dateien (Belege, CSV) müssen mit Token geladen werden, darum nicht einfach per <img src>. */
async function blob(pfad: string, optionen?: Optionen): Promise<Blob> {
  const antwort = await anfrage(pfad, optionen);
  return antwort.blob();
}

// ---------- src/auth ----------
export const auth = {
  login: (daten: LoginDaten) =>
    json<LoginAntwort>('/auth/login', { methode: 'POST', body: daten }),
  me: () => json<User>('/auth/me'),
};

// ---------- src/antraege (Rolle MITARBEITENDE) ----------
export const antraege = {
  meine: () => json<Antrag[]>('/antraege'),
  einer: (id: number) => json<AntragDetail>(`/antraege/${id}`),
  erstellen: (daten: AntragErstellen) =>
    json<AntragDetail>('/antraege', { methode: 'POST', body: daten }),
  loeschen: (id: number) =>
    ohneInhalt(`/antraege/${id}`, { methode: 'DELETE' }),
  einreichen: (id: number) =>
    json<AntragDetail>(`/antraege/${id}/einreichen`, { methode: 'POST' }),
};

// ---------- src/positionen (Rolle MITARBEITENDE) ----------
export const positionen = {
  kilometerpauschale: () =>
    json<{ chfProKilometer: number }>('/positionen/kilometerpauschale'),
  erstellen: (antragId: number, daten: PositionEingabe) =>
    json<Position>(`/antraege/${antragId}/positionen`, {
      methode: 'POST',
      body: daten,
    }),
  aktualisieren: (id: number, daten: PositionEingabe) =>
    json<Position>(`/positionen/${id}`, { methode: 'PATCH', body: daten }),
  loeschen: (id: number) =>
    ohneInhalt(`/positionen/${id}`, { methode: 'DELETE' }),
};

// ---------- src/belege ----------
export const belege = {
  hochladen: (positionId: number, datei: File) => {
    const formData = new FormData();
    formData.append('datei', datei); // Feldname wie im FileInterceptor des Backends
    return json<Beleg>(`/positionen/${positionId}/beleg`, {
      methode: 'POST',
      formData,
    });
  },
  laden: (id: number) => blob(`/belege/${id}`),
  loeschen: (id: number) => ohneInhalt(`/belege/${id}`, { methode: 'DELETE' }),
};

// ---------- src/freigabe (Rolle VORGESETZTE) ----------
export const freigabe = {
  offene: () => json<OffenerAntrag[]>('/freigabe/offen'),
  team: (status?: AntragStatus) =>
    json<Antrag[]>('/freigabe/antraege', { query: { status } }),
  einer: (id: number) => json<AntragDetail>(`/freigabe/antraege/${id}`),
  genehmigen: (id: number) =>
    json<AntragDetail>(`/freigabe/antraege/${id}/genehmigen`, {
      methode: 'POST',
    }),
  zurueckweisen: (id: number, begruendung: string) =>
    json<AntragDetail>(`/freigabe/antraege/${id}/zurueckweisen`, {
      methode: 'POST',
      body: { begruendung },
    }),
  ablehnen: (id: number, begruendung: string) =>
    json<AntragDetail>(`/freigabe/antraege/${id}/ablehnen`, {
      methode: 'POST',
      body: { begruendung },
    }),
};

// ---------- src/lohnbuchhaltung (Rolle LOHNBUCHHALTUNG) ----------
export const lohnbuchhaltung = {
  abrechnungen: (filter: {
    jahr?: number;
    monat?: number;
    status?: AntragStatus;
  }) => json<Antrag[]>('/lohnbuchhaltung/abrechnungen', { query: filter }),
  eine: (id: number) =>
    json<AntragDetail>(`/lohnbuchhaltung/abrechnungen/${id}`),
  exportCsv: (jahr: number, monat: number) =>
    blob('/lohnbuchhaltung/export', { query: { jahr, monat } }),
  ausbezahlt: (id: number) =>
    json<AntragDetail>(`/lohnbuchhaltung/abrechnungen/${id}/ausbezahlt`, {
      methode: 'POST',
    }),
  monatAusbezahlt: (jahr: number, monat: number) =>
    json<AusbezahltErgebnis>('/lohnbuchhaltung/monat/ausbezahlt', {
      methode: 'POST',
      body: { jahr, monat },
    }),
  auswertung: (jahr: number, monat: number) =>
    json<KostenstellenAuswertung[]>('/lohnbuchhaltung/auswertung', {
      query: { jahr, monat },
    }),
};
