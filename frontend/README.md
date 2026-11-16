# Spesenportal - Frontend

Browser-Oberfläche des digitalen Spesenportals (Fach DTR). Spricht mit der REST-API im Ordner `../backend`.
Gruppe: Parwar Habasch, Felix Stalder, Pakierthan Pakeerthan

**Stack:** Vite 8 · TypeScript 6 · HTML und CSS · kein UI-Framework

Bewusst ohne Framework (React, Angular, Svelte): Der Code soll in der Präsentation Zeile für Zeile erklärbar
sein. Alles, was passiert, steht sichtbar im eigenen Code: `fetch` für die API, `createElement` für die
Oberfläche, `location.hash` für die Navigation. Der Stack bleibt derselbe wie im Backend (TypeScript, npm,
Prettier, ESLint).

## Voraussetzungen

- Node.js **24** (LTS), `nvm use 24` oder `mise use node@24`
- Das Backend muss laufen (siehe `../backend/README.md`, Schnellstart), Standard `http://localhost:3000`

## Schnellstart

```bash
cp .env.example .env        # VITE_API_URL anpassen, falls das Backend nicht auf Port 3000 läuft
npm install
npm run dev                 # Oberfläche auf http://localhost:5173
```

Demo-Logins stehen im Backend-README und auf der Anmeldeseite unter «Demo-Zugänge» (Passwort überall `passwort`).

| Skript           | Beschreibung                                         |
| ---------------- | ---------------------------------------------------- |
| `npm run dev`    | Entwicklungsserver mit Hot Reload                    |
| `npm run build`  | Typprüfung und statisches Bundle nach `dist/`        |
| `npm run preview`| Gebautes Bundle lokal ansehen                        |
| `npm run check`  | Nur Typprüfung (`tsc --noEmit`)                      |
| `npm run lint`   | ESLint (gleiche Regeln wie im Backend)               |
| `npm run format` | Prettier                                             |

## Wie die Anwendung funktioniert

Es ist eine Single-Page-Anwendung: `index.html` wird einmal geladen, danach tauscht TypeScript den Inhalt
von `<main id="inhalt">` aus. Drei Mechanismen tragen alles:

1. **Hash-Router** (`src/router.ts`). Die Adresse nach dem `#` bestimmt die Seite, z. B. `#/antraege/3`.
   Beim Ereignis `hashchange` sucht der Router die passende Route (RegExp), prüft Anmeldung und Rolle und
   ruft die Seitenfunktion auf. Deren Rückgabe (ein HTML-Element) ersetzt den Inhalt. `neuLaden()` baut
   die aktuelle Seite neu, das ist nach jedem Speichern der einfachste Weg zu einem frischen Stand.
   Jede Navigation zählt eine Laufnummer hoch. Kommt eine Seite erst fertig, wenn schon die nächste
   Navigation läuft (z. B. 401 führt zur Anmeldung), wird ihr Ergebnis verworfen statt eingesetzt.
2. **API-Client** (`src/api.ts`). Eine Funktion pro Endpunkt, gruppiert wie die Module im Backend
   (`api.antraege.einreichen(id)` ruft `POST /antraege/:id/einreichen`). Alle laufen durch `anfrage()`:
   Token in den Header, JSON kodieren, Fehler als `ApiFehler` mit Status und Meldung des Backends werfen.
   Bei 401 wird die Session gelöscht und zur Anmeldung gewechselt.
3. **DOM bauen ohne Framework** (`src/dom.ts`). `el(tag, eigenschaften, ...kinder)` ist ein kurzer Wrapper
   um `document.createElement`. Texte werden immer als Text eingefügt (`textContent`, `append(string)`),
   nie als `innerHTML`. So kann ein Zweck wie `<script>` nichts anrichten.

Der Zustand der Anwendung liegt im Backend. Der Browser merkt sich nur die Session (Token und Person) im
`localStorage`, siehe `src/session.ts`.

## Dateien

```
index.html                       Grundgerüst: Kopfzeile, <main>, Fusszeile, lädt src/main.ts
vite.config.ts                   Vite-Einstellungen (Port 5173)
.env.example                     VITE_API_URL, Adresse des Backends

src/main.ts                      Einstieg: meldet alle Routen an und startet den Router
src/router.ts                    Hash-Router, Rollenprüfung, neuLaden()
src/api.ts                       fetch-Wrapper, ApiFehler, eine Funktion pro Endpunkt
src/typen.ts                     Interfaces zu den DTOs des Backends (gleiche Feldnamen)
src/session.ts                   Token und User in localStorage
src/dom.ts                       el(), feld(), tabelle(), Formatierung (CHF, Datum, Monat), Statustexte
src/style.css                    Farben als Custom Properties, Karten, Tabellen, Status-Marken, Dialog

src/komponenten/layout.ts        Kopfzeile: Navigation nach Rolle, Person, Abmelden
src/komponenten/antrag-ansicht.ts Gemeinsamer Antragskopf und Positionstabelle für alle drei Rollen
src/komponenten/beleg-dialog.ts  Beleg (Bild oder PDF) mit Token laden und im <dialog> anzeigen

src/seiten/login.ts                    POST /auth/login, Demo-Zugänge
src/seiten/antraege-liste.ts           Mitarbeitende: eigene Abrechnungen, neuen Monat anlegen (MA-4)
src/seiten/antrag-detail.ts            Mitarbeitende: Positionen, Belege, einreichen (MA-1, MA-2, MA-3, MA-5)
src/seiten/freigabe-liste.ts           Vorgesetzte: offene Anträge mit Überfälligkeit, Team-Historie (VG-1, VG-4)
src/seiten/freigabe-detail.ts          Vorgesetzte: prüfen, genehmigen, zurückweisen, ablehnen (VG-2, VG-3)
src/seiten/lohnbuchhaltung-liste.ts    Lohnbuchhaltung: Abrechnungen, CSV-Export, Auszahlung, Kostenstellen (LB-1, LB-3, LB-4)
src/seiten/lohnbuchhaltung-detail.ts   Lohnbuchhaltung: Abrechnung einsehen, einzeln ausbezahlen (LB-2, LB-3)
```

## Aufbau einer Seite

Jede Seite ist eine Funktion, die Daten lädt und ein Element zurückgibt. Beispiel in Kurzform:

```ts
export async function antraegeListeSeite(): Promise<HTMLElement> {
  const antraege = await api.antraege.meine();           // 1. Daten vom Backend
  const zeilen = antraege.map((a) => el('tr', {}, ...)); // 2. DOM bauen
  return el('section', { className: 'karte' }, ...);     // 3. Wurzelelement zurückgeben
}
```

Aktionen (Knöpfe, Formulare) rufen eine API-Funktion und danach `neuLaden()`. Fehler landen in einer
`meldung`-Zeile, die neben der Aktion steht. Ereignis-Handler sind mit `void` markiert, wenn sie ein
Promise starten, auf das bewusst nicht gewartet wird. Die Fehlerbehandlung passiert in der Funktion selbst.

## Fachliche Regeln, die im Frontend sichtbar sind

- **Kategorie FAHRT:** Das Formular zeigt statt des Betrags ein Kilometerfeld mit Vorschau. Geschickt werden
  nur die Kilometer, der Betrag kommt vom Backend (`Kilometer × Pauschale`, MA-2). Die Pauschale liefert
  `GET /positionen/kilometerpauschale`.
- **Datum im Monat:** Das Datumsfeld hat `min` und `max` auf den Abrechnungsmonat.
- **Einreichen (MA-3):** Antwortet das Backend mit 400 und einer Liste `probleme`, wird die Positionstabelle
  mit den Fehlern pro Zeile neu gezeichnet, ohne die Seite zu laden. Der Antrag bleibt unverändert.
- **Bearbeitbar** sind Anträge nur in `ERFASST` und `ZURUECKGEWIESEN`. Sonst fehlen Formular und Aktionen.
- **Begründung:** Zurückweisen und Ablehnen prüfen wie das Backend mindestens 5 Zeichen.
- **Belege und CSV** brauchen den Bearer-Token. Darum kein `<img src>` oder `<a href>`, sondern `fetch`
  als Blob und eine `URL.createObjectURL`-Adresse. Der CSV-Dateiname wird im Frontend gebildet, weil der
  Header `Content-Disposition` bei Cross-Origin-Anfragen nicht lesbar ist.

## Abdeckung der User Stories

| Story | Priorität | Wo im Frontend                                                           |
| ----- | --------- | ------------------------------------------------------------------------ |
| MA-1  | Must      | `antrag-detail.ts`: Beleg hochladen (Foto oder PDF) pro Position         |
| MA-2  | Must      | `antrag-detail.ts`: Kilometerfeld mit Vorschau, Betrag rechnet das Backend |
| MA-3  | Must      | `antrag-detail.ts`: Knopf «Abrechnung einreichen», Fehler pro Position   |
| MA-4  | Must      | `antraege-liste.ts`: Status und Begründung pro Monat                     |
| MA-5  | Should    | `antrag-detail.ts`: «Bearbeiten» füllt das Formular mit einer Position   |
| VG-1  | Must      | `freigabe-liste.ts`: offene Anträge des Teams                            |
| VG-2  | Must      | `freigabe-detail.ts`: Positionen, Belege im Dialog, «Genehmigen»         |
| VG-3  | Must      | `freigabe-detail.ts`: «Zurückweisen» mit Pflicht-Begründung              |
| VG-4  | Should    | `freigabe-liste.ts`: Arbeitstage und Marke «Überfällig», Filter          |
| LB-1  | Must      | `lohnbuchhaltung-liste.ts`: «CSV exportieren»                            |
| LB-2  | Must      | `lohnbuchhaltung-detail.ts`: Positionen mit Belegen                      |
| LB-3  | Must      | `lohnbuchhaltung-detail.ts` und `-liste.ts`: einzeln oder pro Monat ausbezahlen |
| LB-4  | Could     | `lohnbuchhaltung-liste.ts`: Tabelle pro Kostenstelle                     |

## Umsetzungsentscheide

Jeder Entscheid mit Vorteil, Nachteil und der Alternative, die wir verworfen haben.

**Kein UI-Framework.** Vorteil: jede Zeile ist eigener Code, nichts passiert «magisch», kein Build-Wissen
über React oder Angular nötig. Nachteil: Wiederholung beim DOM-Bauen, kein automatisches Nachführen der
Anzeige bei Datenänderung. Alternative: Angular passt zum NestJS-Backend (Decorators, Module, Services),
bringt aber viel Konzeptlast für eine Oberfläche dieser Grösse.

**Vite als Entwicklungsserver und Bundler.** Vorteil: TypeScript ohne eigene Konfiguration, Hot Reload,
ein statischer Ordner `dist/` als Ergebnis. Nachteil: eine Abhängigkeit mehr als reines HTML und JS.
Alternative: TypeScript direkt mit `tsc` nach JS übersetzen und per `<script type="module">` laden.

**Hash-Router (`#/antraege/3`).** Vorteil: funktioniert auf jedem statischen Webserver ohne Umleitung,
der Browser lädt die Seite nicht neu, Zurück-Knopf funktioniert. Nachteil: das `#` in der Adresse.
Alternative: History API (`pushState`) mit sauberen Pfaden, braucht aber eine Server-Regel, die alle Pfade
auf `index.html` leitet.

**Seite nach jeder Aktion neu laden (`neuLaden()`).** Vorteil: kein eigener Zustand im Browser, der vom
Backend abweichen könnte; eine Stelle, die rendert. Nachteil: eine zusätzliche Anfrage pro Aktion, kurzes
Flackern bei langsamer Verbindung. Alternative: Antwort der Aktion direkt in die bestehende Tabelle
einarbeiten, spart Anfragen, verdoppelt aber die Render-Logik.

**DOM mit `createElement` statt `innerHTML` oder `<template>`.** Vorteil: Texte aus dem Backend werden nie
als HTML gedeutet (kein XSS), TypeScript kennt die Elementtypen. Nachteil: HTML-Struktur steht im
TypeScript, nicht im HTML. Alternative: `<template>`-Blöcke in `index.html` klonen, lesbarer für HTML-Leute,
aber zwei Orte für dieselbe Struktur.

**Token im `localStorage`.** Vorteil: einfach, überlebt den Neustart des Browsers, kein Cookie-Handling.
Nachteil: für JavaScript auf der Seite lesbar, darum ist der Verzicht auf `innerHTML` wichtig.
Alternative: HttpOnly-Cookie, sicherer gegen XSS, braucht aber CSRF-Schutz und Anpassungen im Backend.

**Belege per `fetch` als Blob laden.** Vorteil: der Bearer-Token wird mitgeschickt, das Backend prüft die
Berechtigung. Nachteil: mehr Code als ein `<img src>`. Alternative: signierte, kurzlebige URLs vom Backend,
dann ginge `<img src>` direkt.

## Sicherheit

- Token im `localStorage`, Lebensdauer bestimmt das Backend (`JWT_EXPIRES_IN`). Bei 401 automatisch abmelden.
- Keine `innerHTML`-Zuweisungen. Alle Texte aus dem Backend gehen über `textContent`.
- Rollen werden im Router nur für die Navigation geprüft. Durchgesetzt werden sie im Backend (Guards).
