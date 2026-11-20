/**
 * Typen für die Daten, die das Backend liefert und erwartet.
 * Jede Schnittstelle entspricht einem DTO im Backend (siehe Kommentar).
 * Zeitstempel kommen als ISO-Strings über JSON, nicht als Date-Objekte.
 */

// ---------- Feste Werte: einzige Stelle mit den Texten der Status, Rollen und Kategorien ----------

/** Rollen (prisma/schema.prisma: enum Rolle). Im Code immer ROLLE.X statt eines Textes verwenden. */
export const ROLLE = {
  MITARBEITENDE: 'MITARBEITENDE',
  VORGESETZTE: 'VORGESETZTE',
  LOHNBUCHHALTUNG: 'LOHNBUCHHALTUNG',
} as const;
export type Rolle = (typeof ROLLE)[keyof typeof ROLLE];

/** Status eines Antrags (prisma/schema.prisma: enum AntragStatus, siehe docs/zustandsdiagramm.md). */
export const STATUS = {
  ERFASST: 'ERFASST',
  EINGEREICHT: 'EINGEREICHT',
  ZURUECKGEWIESEN: 'ZURUECKGEWIESEN',
  GENEHMIGT: 'GENEHMIGT',
  AUSBEZAHLT: 'AUSBEZAHLT',
  ABGELEHNT: 'ABGELEHNT',
} as const;
export type AntragStatus = (typeof STATUS)[keyof typeof STATUS];

/** Alle Status in der Reihenfolge des Ablaufs. */
export const ALLE_STATUS: AntragStatus[] = Object.values(STATUS);

/** Kategorien einer Position (prisma/schema.prisma: enum Kategorie). */
export const KATEGORIE = {
  FAHRT: 'FAHRT',
  VERPFLEGUNG: 'VERPFLEGUNG',
  UEBERNACHTUNG: 'UEBERNACHTUNG',
  MATERIAL: 'MATERIAL',
} as const;
export type Kategorie = (typeof KATEGORIE)[keyof typeof KATEGORIE];

/** Alle Kategorien für die Auswahlliste. */
export const ALLE_KATEGORIEN: Kategorie[] = Object.values(KATEGORIE);

/** Dateitypen, die das Backend als Beleg annimmt (src/belege/belege.service.ts). */
export const BELEG_TYPEN = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

/** Maximale Grösse eines Belegs in Bytes (10 MB, wie im Backend). */
export const BELEG_MAX_BYTES = 10 * 1024 * 1024;

/** Frist für den Entscheid der vorgesetzten Person in Arbeitstagen (VG-4). */
export const FRIST_ARBEITSTAGE = 2;

// src/auth/dto/user.dto.ts: UserDto
export interface User {
  id: number;
  personalnummer: string;
  email: string;
  name: string;
  rolle: Rolle;
  kostenstelle: string;
  vorgesetzteId: number | null;
}

// src/auth/dto/login.dto.ts: LoginDto
export interface LoginDaten {
  email: string;
  passwort: string;
}

// src/auth/dto/user.dto.ts: LoginResponseDto
export interface LoginAntwort {
  accessToken: string;
  user: User;
}

// src/antraege/dto/antrag.dto.ts: PersonKurzDto
export interface PersonKurz {
  id: number;
  personalnummer: string;
  name: string;
  kostenstelle: string;
}

// src/antraege/dto/antrag.dto.ts: BelegDto
export interface Beleg {
  id: number;
  positionId: number;
  dateiname: string;
  mimeType: string;
  groesse: number;
  url: string;
  hochgeladenAm: string;
}

// src/antraege/dto/antrag.dto.ts: PositionDto
export interface Position {
  id: number;
  antragId: number;
  datum: string; // YYYY-MM-DD
  kategorie: Kategorie;
  zweck: string;
  kilometer: number | null;
  betrag: number;
  beleg: Beleg | null;
}

// src/antraege/dto/antrag.dto.ts: AntragDto (Listenansicht ohne Positionen)
export interface Antrag {
  id: number;
  jahr: number;
  monat: number;
  status: AntragStatus;
  mitarbeitende: PersonKurz;
  anzahlPositionen: number;
  total: number;
  begruendung: string | null;
  eingereichtAm: string | null;
  entschiedenVon: PersonKurz | null;
  entschiedenAm: string | null;
  ausbezahltAm: string | null;
  erstelltAm: string;
  geaendertAm: string;
}

// src/antraege/dto/antrag.dto.ts: StatusAenderungDto (ein Eintrag im Verlauf)
export interface StatusAenderung {
  id: number;
  vonStatus: AntragStatus | null;
  nachStatus: AntragStatus;
  zeitpunkt: string;
  person: PersonKurz;
  rolle: Rolle;
  begruendung: string | null;
}

// src/antraege/dto/antrag.dto.ts: AntragDetailDto
export interface AntragDetail extends Antrag {
  positionen: Position[];
  verlauf: StatusAenderung[];
}

// src/antraege/dto/create-antrag.dto.ts: CreateAntragDto
export interface AntragErstellen {
  jahr: number;
  monat: number;
}

// src/positionen/dto/position-input.dto.ts: CreatePositionDto
// Bei FAHRT werden Kilometer geschickt, sonst der Betrag. Das Backend rechnet bei FAHRT selbst.
export interface PositionEingabe {
  datum: string;
  kategorie: Kategorie;
  zweck: string;
  kilometer?: number;
  betrag?: number;
}

// src/antraege/dto/einreichen-fehler.dto.ts: PositionFehlerDto
export interface PositionFehler {
  positionId: number | null;
  fehler: string[];
}

// src/freigabe/dto/freigabe.dto.ts: OffenerAntragDto
export interface OffenerAntrag extends Antrag {
  offenSeitArbeitstagen: number;
  ueberfaellig: boolean;
}

// src/lohnbuchhaltung/dto/lohnbuchhaltung.dto.ts: AusbezahltErgebnisDto
export interface AusbezahltErgebnis {
  anzahl: number;
  antragIds: number[];
}

// src/lohnbuchhaltung/dto/lohnbuchhaltung.dto.ts: KostenstellenAuswertungDto
export interface KostenstellenAuswertung {
  kostenstelle: string;
  anzahlAbrechnungen: number;
  anzahlPositionen: number;
  total: number;
}
