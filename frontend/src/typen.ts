/**
 * Typen für die Daten, die das Backend liefert und erwartet.
 * Jede Schnittstelle entspricht einem DTO im Backend (siehe Kommentar).
 * Zeitstempel kommen als ISO-Strings über JSON, nicht als Date-Objekte.
 */

// prisma/schema.prisma: enum Rolle
export type Rolle = 'MITARBEITENDE' | 'VORGESETZTE' | 'LOHNBUCHHALTUNG';

// prisma/schema.prisma: enum AntragStatus (Zustandsautomat des Antrags)
export type AntragStatus =
  | 'ERFASST'
  | 'EINGEREICHT'
  | 'ZURUECKGEWIESEN'
  | 'GENEHMIGT'
  | 'AUSBEZAHLT'
  | 'ABGELEHNT';

export const ALLE_STATUS: AntragStatus[] = [
  'ERFASST',
  'EINGEREICHT',
  'ZURUECKGEWIESEN',
  'GENEHMIGT',
  'AUSBEZAHLT',
  'ABGELEHNT',
];

// prisma/schema.prisma: enum Kategorie
export type Kategorie = 'FAHRT' | 'VERPFLEGUNG' | 'UEBERNACHTUNG' | 'MATERIAL';

export const ALLE_KATEGORIEN: Kategorie[] = [
  'FAHRT',
  'VERPFLEGUNG',
  'UEBERNACHTUNG',
  'MATERIAL',
];

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

// src/antraege/dto/antrag.dto.ts: AntragDetailDto
export interface AntragDetail extends Antrag {
  positionen: Position[];
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
