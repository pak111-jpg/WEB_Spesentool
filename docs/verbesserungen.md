# Verbesserungen

Vorhaben, die beim Arbeiten aufgefallen sind, aber nicht zur jeweiligen Aufgabe gehörten. Status: offen,
eingeplant, verworfen oder erledigt.

## 2026-11-16 Seed-Demo für "überfällig" vom Wochentag unabhängig machen
- Bereich: Backend (prisma/seed.ts)
- Vorschlag: Carlas Antrag nicht 4 Kalendertage, sondern mindestens 4 Arbeitstage vor heute einreichen lassen
  (z. B. 7 Tage zurück), damit die Marke "überfällig" an jedem Wochentag erscheint
- Nutzen: Die Demo für VG-4 funktioniert verlässlich; am Montag zählt das Backend nur 2 Arbeitstage und zeigt
  nichts
- Quelle: freigabe.service.ts arbeitstageZwischen(), Test am Montag 16.11.2026
- Status: offen

## 2026-11-16 db:up auch ohne Docker ermöglichen
- Bereich: Backend (package.json, README)
- Vorschlag: Im README einen podman-Befehl als Alternative zu `npm run db:up` nennen oder das Skript auf
  `podman compose` prüfen lassen
- Nutzen: Fedora-Laptops ohne Docker Desktop können das Backend lokal starten
- Quelle: Felix' Laptop hat podman 6, kein docker; verwendet wurde
  `podman run -d --name spesen-db -e MARIADB_ROOT_PASSWORD=spesen -e MARIADB_DATABASE=spesen -p 53306:3306 docker.io/library/mariadb:11`
- Status: offen

## 2026-11-16 Backend-Lockfile stabil halten
- Bereich: Backend (package-lock.json)
- Vorschlag: Prüfen, warum ein einfaches `npm install` drei Zeilen im Lockfile ändert, und `npm ci` für
  reproduzierbare Installationen im README empfehlen
- Nutzen: Kein Rauschen im Git-Status bei jedem Teammitglied
- Quelle: `git diff --stat backend/package-lock.json` nach `npm install` am 16.11.2026 (3 Zeilen)
- Status: offen
