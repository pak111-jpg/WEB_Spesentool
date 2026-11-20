# Spesenportal – Frontend

Browser-Oberfläche des digitalen Spesenportals. Spricht mit der REST-API im Ordner `../backend`.
Gesamtübersicht, Start und alle Pflichtangaben: siehe [README im Hauptordner](../README.md).

**Stack:** HTML, CSS und JavaScript als ES-Module · kein UI- oder CSS-Framework · kein Übersetzungsschritt · Vite 8 nur als Entwicklungsserver

Bewusst ohne Framework (React, Angular, Svelte): Der Code soll Zeile für Zeile erklärbar sein. Alles, was
passiert, steht sichtbar im eigenen Code: `fetch` für die API, `createElement` für die Oberfläche,
`location.hash` für die Navigation.

## Start (nur Frontend)

```bash
npm install
npm run dev                 # Oberfläche auf http://localhost:5173 (Backend muss laufen)
```

Läuft das Backend nicht auf Port 3000, die Adresse in `src/api.js` (`API_URL`) anpassen.
Ohne Vite geht es auch: Im Ordner `frontend` einen beliebigen Webserver starten, z. B.
`python -m http.server 5173`. Der Browser lädt die Module direkt, es wird nichts übersetzt.

| Skript           | Beschreibung                                                     |
| ---------------- | ---------------------------------------------------------------- |
| `npm run dev`    | Entwicklungsserver mit Hot Reload                                |
| `npm run build`  | optional: gebündelte Fassung nach `dist/`                        |
| `npm run lint`   | ESLint inkl. Regeln aus dem Bewertungsraster (max. 40 Zeilen pro Funktion, `===`, kein `var`, kein `innerHTML`, keine `on…`-Zuweisungen) |
| `npm run format` | Prettier                                                         |

## Wie die Anwendung funktioniert

Single-Page-Anwendung: `index.html` wird einmal geladen, danach tauscht JavaScript den Inhalt von
`<main id="inhalt">` aus.

1. **Hash-Router** (`src/router.js`): Die Adresse nach dem `#` bestimmt die Seite, z. B. `#/antraege/3`. Der
   Router prüft Anmeldung und Rolle, setzt während des Ladens `aria-busy` (das CSS zeigt «Daten werden
   geladen …»), zeigt eine gemerkte Bestätigung oben an und bei einem Fehler eine Fehlerseite mit «Erneut versuchen».
2. **API-Client** (`src/api.js`): eine Funktion pro Endpunkt, alle über `anfrage()`: Token mitschicken, JSON
   kodieren, Fehler als `ApiFehler` mit der Meldung des Backends. Bei 401 wird abgemeldet.
3. **Oberfläche ohne Framework** (`src/dom.js`): `el(tag, eigenschaften, ...kinder)` ist ein Wrapper um
   `document.createElement`. Texte werden immer als Text eingefügt, nie als HTML. Ereignisse nur mit `addEventListener`.

## Module

| Datei | Aufgabe |
| ----- | ------- |
| `main.js` | meldet alle Routen an und startet den Router |
| `router.js` | Hash-Router, Rollenprüfung, Lade- und Fehlerzustand, `neuLaden()` |
| `api.js` | einzige Stelle mit `fetch`, eine Funktion pro Endpunkt |
| `session.js` | Token und Person im `localStorage` |
| `typen.js` | Konstanten `STATUS`, `ROLLE`, `KATEGORIE` (mit `Object.freeze`), Belegtypen, Frist; Datenstrukturen der API als JSDoc `@typedef` |
| `regeln.js` | Prozesslogik: welche Aktion in welchem Status möglich ist, Vollständigkeit, Summen |
| `validierung.js` | wiederverwendbare Validierungsregeln (`pflicht`, `positiveZahl`, `datumZwischen`, …) |
| `liste.js` | Sortieren und kombiniertes Filtern |
| `formular.js` | Feld mit Label und Fehlermeldung, `pruefeFelder()`, Backend-Fehler beim passenden Feld |
| `rueckmeldung.js` | Bestätigung nach einer Aktion für die nächste Seite merken |
| `dom.js`, `format.js`, `texte.js` | Elemente bauen; CHF und Daten formatieren; Anzeigetexte zu den Konstanten |
| `komponenten/layout.js` | Kopfzeile mit Navigation nach Rolle und Abmelden |
| `komponenten/antrag-ansicht.js` | Antragskopf, Positionstabelle und Verlauf für alle Rollen |
| `komponenten/sortier-tabelle.js` | Tabelle, die per Klick auf den Spaltenkopf sortiert |
| `komponenten/position-formular.js` | Formular für neue oder bestehende Positionen (MA-1, MA-2, MA-5) |
| `komponenten/position-aktionen.js` | Knöpfe pro Position: Bearbeiten, Beleg hochladen, entfernen, löschen |
| `komponenten/beleg-dialog.js` | Beleg mit Token laden und im `<dialog>` zeigen |
| `seiten/*.js` | eine Funktion pro Seite: Login, Meine Abrechnungen, Abrechnung, Freigabe, Antrag prüfen, Abrechnungen LB, Abrechnung LB |

## Umsetzungsentscheide

Jeder Entscheid mit Vorteil, Nachteil und der Alternative, die wir verworfen haben.

**Kein UI-Framework.** Vorteil: jede Zeile ist eigener Code, nichts passiert «magisch», kein Build-Wissen
über React oder Angular nötig. Nachteil: Wiederholung beim DOM-Bauen, kein automatisches Nachführen der
Anzeige bei Datenänderung. Alternative: Angular passt zum NestJS-Backend (Decorators, Module, Services),
bringt aber viel Konzeptlast für eine Oberfläche dieser Grösse.

**JavaScript-Module ohne Übersetzungsschritt.** Vorteil: Der Code im Editor ist genau der Code im Browser;
`<script type="module">` und `import`/`export` mit `.js`-Endung funktionieren in jedem aktuellen Browser.
Nachteil: keine Typprüfung wie in TypeScript; Tippfehler bei Eigenschaften fallen erst beim Ausführen auf.
Darum beschreiben JSDoc-Kommentare die Datenstrukturen, und ESLint meldet unbekannte Variablen.
Alternative: TypeScript, das vor dem Ausführen übersetzt werden muss.

**Vite nur als Entwicklungsserver.** Vorteil: Hot Reload, keine Konfiguration. Nachteil: eine Abhängigkeit
mehr. Alternative: jeder andere statische Webserver, der Code bleibt derselbe.

**Hash-Router (`#/antraege/3`).** Vorteil: funktioniert auf jedem statischen Webserver ohne Umleitung,
der Browser lädt die Seite nicht neu, Zurück-Knopf funktioniert. Nachteil: das `#` in der Adresse.
Alternative: History API (`pushState`) mit sauberen Pfaden, braucht aber eine Server-Regel, die alle Pfade
auf `index.html` leitet.

**Seite nach jeder Aktion neu laden (`neuLaden()`).** Vorteil: kein eigener Zustand im Browser, der vom
Backend abweichen könnte; eine Stelle, die rendert. Die Bestätigung merkt sich `rueckmeldung.js` und der
Router zeigt sie oben auf der neuen Seite. Nachteil: eine zusätzliche Anfrage pro Aktion, kurzes Flackern
bei langsamer Verbindung. Alternative: Antwort der Aktion direkt in die bestehende Tabelle einarbeiten,
spart Anfragen, verdoppelt aber die Render-Logik.

**Validierung zuerst im Browser, verbindlich im Backend.** Vorteil: Die Meldung erscheint sofort beim Feld,
ohne Anfrage. Nachteil: Die Regeln stehen zweimal (z. B. Vollständigkeit in `regeln.js` und im Backend).
Alternative: nur das Backend prüfen lassen und dessen Meldungen anzeigen; einfacher, aber träger.

**Tabellen als Karten auf dem Handy.** Vorteil: Jede Zeile ist ohne seitliches Wischen lesbar. Nachteil: mehr
CSS (Media Query, `data-label` pro Zelle). Alternative: Tabelle in einem scrollbaren Rahmen, weniger Code,
aber auf 375 px schlecht lesbar.

**DOM mit `createElement` statt `innerHTML` oder `<template>`.** Vorteil: Texte aus dem Backend werden nie
als HTML gedeutet (kein XSS). Nachteil: HTML-Struktur steht im
JavaScript, nicht im HTML. Alternative: `<template>`-Blöcke in `index.html` klonen, lesbarer für HTML-Leute,
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
