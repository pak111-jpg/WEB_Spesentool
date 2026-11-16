# Spesenportal

Digitales Spesenportal, Übungsprojekt im Fach DTR (gibb HF).
Gruppe: Parwar Habasch, Felix Stalder, Pakierthan Pakeerthan

Mitarbeitende erfassen Spesen mit Beleg und reichen die Monatsabrechnung ein, Vorgesetzte entscheiden
(genehmigen, zurückweisen, ablehnen), die Lohnbuchhaltung exportiert und zahlt aus.

| Ordner      | Inhalt                                                   | Start                  |
| ----------- | -------------------------------------------------------- | ---------------------- |
| `backend/`  | REST-API: NestJS 12, Prisma 7, MariaDB, JWT, Swagger     | siehe `backend/README.md`  |
| `frontend/` | Browser-Oberfläche: Vite, TypeScript, ohne UI-Framework  | siehe `frontend/README.md` |

Reihenfolge beim Starten: Datenbank, Backend (Port 3000), Frontend (Port 5173).
Demo-Logins stehen im Backend-README, Passwort überall `passwort`.
