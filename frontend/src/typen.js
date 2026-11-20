/**
 * Typen für die Daten, die das Backend liefert und erwartet.
 * Jede Schnittstelle entspricht einem DTO im Backend (siehe Kommentar).
 * Zeitstempel kommen als ISO-Strings über JSON, nicht als Date-Objekte.
 */

// ---------- Feste Werte: einzige Stelle mit den Texten der Status, Rollen und Kategorien ----------

/** Rollen (prisma/schema.prisma: enum Rolle). Im Code immer ROLLE.X statt eines Textes verwenden. */
export const ROLLE = Object.freeze({
  MITARBEITENDE: 'MITARBEITENDE',
  VORGESETZTE: 'VORGESETZTE',
  LOHNBUCHHALTUNG: 'LOHNBUCHHALTUNG',
});
/**
 * @typedef {'MITARBEITENDE' | 'VORGESETZTE' | 'LOHNBUCHHALTUNG'} Rolle
 */

/** Status eines Antrags (prisma/schema.prisma: enum AntragStatus, siehe docs/zustandsdiagramm.md). */
export const STATUS = Object.freeze({
  ERFASST: 'ERFASST',
  EINGEREICHT: 'EINGEREICHT',
  ZURUECKGEWIESEN: 'ZURUECKGEWIESEN',
  GENEHMIGT: 'GENEHMIGT',
  AUSBEZAHLT: 'AUSBEZAHLT',
  ABGELEHNT: 'ABGELEHNT',
});
/**
 * @typedef {'ERFASST' | 'EINGEREICHT' | 'ZURUECKGEWIESEN' | 'GENEHMIGT' | 'AUSBEZAHLT' | 'ABGELEHNT'} AntragStatus
 */

/** Alle Status in der Reihenfolge des Ablaufs. */
export const ALLE_STATUS = Object.values(STATUS);

/** Kategorien einer Position (prisma/schema.prisma: enum Kategorie). */
export const KATEGORIE = Object.freeze({
  FAHRT: 'FAHRT',
  VERPFLEGUNG: 'VERPFLEGUNG',
  UEBERNACHTUNG: 'UEBERNACHTUNG',
  MATERIAL: 'MATERIAL',
});
/**
 * @typedef {'FAHRT' | 'VERPFLEGUNG' | 'UEBERNACHTUNG' | 'MATERIAL'} Kategorie
 */

/** Alle Kategorien für die Auswahlliste. */
export const ALLE_KATEGORIEN = Object.values(KATEGORIE);

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

/**
 * src/auth/dto/user.dto.ts: UserDto
 * @typedef {Object} User
 * @property {number} id
 * @property {string} personalnummer
 * @property {string} email
 * @property {string} name
 * @property {Rolle} rolle
 * @property {string} kostenstelle
 * @property {number | null} vorgesetzteId
 */

/**
 * src/auth/dto/login.dto.ts: LoginDto
 * @typedef {Object} LoginDaten
 * @property {string} email
 * @property {string} passwort
 */

/**
 * src/auth/dto/user.dto.ts: LoginResponseDto
 * @typedef {Object} LoginAntwort
 * @property {string} accessToken
 * @property {User} user
 */

/**
 * src/antraege/dto/antrag.dto.ts: PersonKurzDto
 * @typedef {Object} PersonKurz
 * @property {number} id
 * @property {string} personalnummer
 * @property {string} name
 * @property {string} kostenstelle
 */

/**
 * src/antraege/dto/antrag.dto.ts: BelegDto
 * @typedef {Object} Beleg
 * @property {number} id
 * @property {number} positionId
 * @property {string} dateiname
 * @property {string} mimeType
 * @property {number} groesse
 * @property {string} url
 * @property {string} hochgeladenAm
 */

/**
 * src/antraege/dto/antrag.dto.ts: PositionDto
 * @typedef {Object} Position
 * @property {number} id
 * @property {number} antragId
 * @property {string} datum YYYY-MM-DD
 * @property {Kategorie} kategorie
 * @property {string} zweck
 * @property {number | null} kilometer
 * @property {number} betrag
 * @property {Beleg | null} beleg
 */

/**
 * src/antraege/dto/antrag.dto.ts: AntragDto (Listenansicht ohne Positionen)
 * @typedef {Object} Antrag
 * @property {number} id
 * @property {number} jahr
 * @property {number} monat
 * @property {AntragStatus} status
 * @property {PersonKurz} mitarbeitende
 * @property {number} anzahlPositionen
 * @property {number} total
 * @property {string | null} begruendung
 * @property {string | null} eingereichtAm
 * @property {PersonKurz | null} entschiedenVon
 * @property {string | null} entschiedenAm
 * @property {string | null} ausbezahltAm
 * @property {string} erstelltAm
 * @property {string} geaendertAm
 */

/**
 * src/antraege/dto/antrag.dto.ts: StatusAenderungDto (ein Eintrag im Verlauf)
 * @typedef {Object} StatusAenderung
 * @property {number} id
 * @property {AntragStatus | null} vonStatus
 * @property {AntragStatus} nachStatus
 * @property {string} zeitpunkt
 * @property {PersonKurz} person
 * @property {Rolle} rolle
 * @property {string | null} begruendung
 */

/**
 * src/antraege/dto/antrag.dto.ts: AntragDetailDto
 * @typedef {Antrag & Object} AntragDetail
 * @property {Position[]} positionen
 * @property {StatusAenderung[]} verlauf
 */

/**
 * src/antraege/dto/create-antrag.dto.ts: CreateAntragDto
 * @typedef {Object} AntragErstellen
 * @property {number} jahr
 * @property {number} monat
 */

/**
 * src/positionen/dto/position-input.dto.ts: CreatePositionDto
 * Bei FAHRT werden Kilometer geschickt, sonst der Betrag. Das Backend rechnet bei FAHRT selbst.
 * @typedef {Object} PositionEingabe
 * @property {string} datum
 * @property {Kategorie} kategorie
 * @property {string} zweck
 * @property {number} [kilometer]
 * @property {number} [betrag]
 */

/**
 * src/antraege/dto/einreichen-fehler.dto.ts: PositionFehlerDto
 * @typedef {Object} PositionFehler
 * @property {number | null} positionId
 * @property {string[]} fehler
 */

/**
 * src/freigabe/dto/freigabe.dto.ts: OffenerAntragDto
 * @typedef {Antrag & Object} OffenerAntrag
 * @property {number} offenSeitArbeitstagen
 * @property {boolean} ueberfaellig
 */

/**
 * src/lohnbuchhaltung/dto/lohnbuchhaltung.dto.ts: AusbezahltErgebnisDto
 * @typedef {Object} AusbezahltErgebnis
 * @property {number} anzahl
 * @property {number[]} antragIds
 */

/**
 * src/lohnbuchhaltung/dto/lohnbuchhaltung.dto.ts: KostenstellenAuswertungDto
 * @typedef {Object} KostenstellenAuswertung
 * @property {string} kostenstelle
 * @property {number} anzahlAbrechnungen
 * @property {number} anzahlPositionen
 * @property {number} total
 */
