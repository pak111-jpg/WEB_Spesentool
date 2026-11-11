# Spesenportal – Backend

REST-API des digitalen Spesenportals (Fach DTR).
Gruppe: Parwar Habasch, Felix Stalder, Pakierthan Pakeerthan

**Stack:** NestJS 12 · Prisma 7 · TypeScript 6 · MariaDB 11 (Docker) · JWT-Auth · Swagger/OpenAPI

## Voraussetzungen

- Node.js **24** (LTS) – `nvm use 24`. Mindestens 24.9: NestJS 12 ist ESM-only, und Jest kann ESM-Pakete erst ab Node 24.9 per `require` laden.
- Docker Desktop (für die Datenbank)

## Schnellstart

```bash
cp .env.example .env        # Werte bei Bedarf anpassen
npm install
npm run db:up               # MariaDB-Container starten (Port 53306)
npm run db:migrate          # Tabellen anlegen
npm run db:seed             # Demo-Personen und -Anträge einspielen
npm run start:dev           # API auf http://localhost:3000
```

Swagger-UI: **http://localhost:3000/api** (OpenAPI-JSON: `/api-json`)

### Demo-Logins (Passwort überall `passwort`)

| E-Mail                  | Rolle            | Bemerkung                           |
| ----------------------- | ---------------- | ----------------------------------- |
| anna.meier@firma.ch     | MITARBEITENDE    | Team von Beat, KST-100              |
| carla.huber@firma.ch    | MITARBEITENDE    | Team von Beat, KST-200              |
| beat.keller@firma.ch    | VORGESETZTE      | sieht die Anträge von Anna + Carla  |
| lena.schmid@firma.ch    | LOHNBUCHHALTUNG  | Export, Auszahlung, Auswertung      |

In Swagger: `POST /auth/login` ausführen, `accessToken` kopieren, oben rechts auf **Authorize** und als Bearer-Token eintragen.

## Fachlicher Ablauf (aus UML / User Stories)

```
ERFASST ──einreichen──▶ EINGEREICHT ──genehmigen──▶ GENEHMIGT ──ausbezahlt──▶ AUSBEZAHLT
                            │  ▲
                            │  └── erneut einreichen ── ZURUECKGEWIESEN ◀── zurückweisen (mit Begründung)
                            └──ablehnen (mit Begründung)──▶ ABGELEHNT
```

- Pro Person und Monat genau **ein** Spesenantrag (`@@unique(mitarbeitendeId, jahr, monat)`).
- Einreichen nur, wenn **jede** Position Datum, Betrag, Zweck und Beleg hat – sonst `400` mit Liste der betroffenen Positionen (MA-3).
- Bei Kategorie `FAHRT` rechnet das System `Kilometer × Pauschale` (`KILOMETERPAUSCHALE_CHF` in `.env`, MA-2).
- Vorgesetzte sehen nur `EINGEREICHT`-Anträge des eigenen Teams; `ueberfaellig` ab > 2 Arbeitstagen (VG-1, VG-4).
- Zurückweisen und Ablehnen brauchen eine Begründung (VG-3); zurückgewiesene Anträge sind wieder bearbeitbar und werden **derselbe** Antrag erneut eingereicht.
- Export (CSV) enthält nur `GENEHMIGT`; ausbezahlte Abrechnungen erscheinen nicht erneut (LB-1).
- `AUSBEZAHLT` ist Endzustand – ein zweites Markieren gibt `409` (LB-3).

## Endpunkte (Überblick)

| Rolle           | Methode & Pfad                                      | Zweck                                   |
| --------------- | --------------------------------------------------- | --------------------------------------- |
| alle            | `POST /auth/login`, `GET /auth/me`                  | Anmeldung, Profil                       |
| MITARBEITENDE   | `POST/GET /antraege`, `GET/DELETE /antraege/:id`    | Monatsabrechnung anlegen / ansehen      |
| MITARBEITENDE   | `POST /antraege/:id/einreichen`                     | Einreichen (MA-3)                       |
| MITARBEITENDE   | `POST /antraege/:id/positionen`, `PATCH/DELETE /positionen/:id` | Positionen erfassen / korrigieren |
| MITARBEITENDE   | `POST /positionen/:id/beleg` (multipart `datei`)    | Beleg hochladen (MA-1)                  |
| alle (berechtigt) | `GET /belege/:id`                                 | Belegdatei anzeigen                     |
| VORGESETZTE     | `GET /freigabe/offen`, `GET /freigabe/antraege[/:id]` | Offene Anträge / Team-Historie        |
| VORGESETZTE     | `POST /freigabe/antraege/:id/{genehmigen,zurueckweisen,ablehnen}` | Entscheid                 |
| LOHNBUCHHALTUNG | `GET /lohnbuchhaltung/abrechnungen[/:id]`           | Genehmigte Abrechnungen einsehen        |
| LOHNBUCHHALTUNG | `GET /lohnbuchhaltung/export?jahr&monat`            | CSV-Export (LB-1)                       |
| LOHNBUCHHALTUNG | `POST /lohnbuchhaltung/abrechnungen/:id/ausbezahlt`, `POST /lohnbuchhaltung/monat/ausbezahlt` | Auszahlung markieren (LB-3) |
| LOHNBUCHHALTUNG | `GET /lohnbuchhaltung/auswertung?jahr&monat`        | Spesen pro Kostenstelle (LB-4)          |

Details, Request-/Response-Schemas und Beispiele: Swagger-UI.

## Projektstruktur

```
prisma/schema.prisma        Datenmodell (User, Spesenantrag, Position, Beleg)
prisma/seed.ts              Demo-Daten
src/auth                    Login, JWT
src/common                  Guards (JWT, Rollen), Decorators (@Auth, @CurrentUser)
src/antraege                Spesenanträge der Mitarbeitenden + DTOs/Mapper
src/positionen              Positionen, Kilometerpauschale
src/belege                  Datei-Upload/-Download (Ordner `uploads/`)
src/freigabe                Prüfen & entscheiden (Vorgesetzte)
src/lohnbuchhaltung         Export, Auszahlung, Auswertung
```

## Nützliche Skripte

| Skript                | Beschreibung                                   |
| --------------------- | ---------------------------------------------- |
| `npm run db:up/down`  | DB-Container starten / stoppen                 |
| `npm run db:migrate`  | Migration erstellen & anwenden (`prisma migrate dev`) |
| `npm run db:seed`     | Demo-Daten neu einspielen                      |
| `npm run db:reset`    | DB leeren, Migrationen + Seed erneut ausführen |
| `npm run db:studio`   | Prisma Studio (DB im Browser)                  |
| `npm run prisma:generate` | Prisma-Client nach Schemaänderung neu erzeugen |
| `npm run lint` / `format` | ESLint / Prettier                          |
