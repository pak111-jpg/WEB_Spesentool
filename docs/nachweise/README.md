# Nachweise Basisanforderungen

Erstellt am 20.11.2026 mit der laufenden Anwendung (Demo-Daten frisch geladen, Chrome).
Die Tabelle mit allen Prüfpunkten G1.1 bis G5.5 steht im [README im Hauptordner](../../README.md#nachweis-basisanforderungen).

| Pflichtnachweis | Datei | Ergebnis |
| --------------- | ----- | -------- |
| G1.1 W3C-Validator pro Seite | [`G1.1-w3c/`](G1.1-w3c) (7 Seiten) | 0 Fehler, 0 Warnungen auf allen Seiten |
| G3.2, G3.4, G3.5 jede Seite bei 375 px | [`G3-375px/`](G3-375px) (7 Seiten), [`G3.2-scrollbreite-375.json`](G3.2-scrollbreite-375.json) | Seitenbreite überall 375 px, kein horizontales Scrollen |
| G4.1 Konsole nach vollständigem Prozessdurchlauf | [`G4.1-konsole.png`](G4.1-konsole.png), [`G4.1-konsole.json`](G4.1-konsole.json) | 0 Fehler, 0 Warnungen (nur Debug-Meldungen des Vite-Entwicklungsservers) |
| G5.1 Lighthouse Startseite | [`G5.1-lighthouse-startseite.png`](G5.1-lighthouse-startseite.png), [Bericht](G5.1-lighthouse-startseite.html) | Accessibility 100, Best Practices 100 |

Weitere Nachweise:

| Prüfpunkt | Datei |
| --------- | ----- |
| G5.2 Tastaturbedienung | [`G5.2-tastatur-protokoll.txt`](G5.2-tastatur-protokoll.txt): ganzer Prozess mit 35 Tastaturschritten |
| G5.3 sichtbarer Fokus | [`G5.3-fokus-link.png`](G5.3-fokus-link.png), [`G5.3-fokus-eingabefeld.png`](G5.3-fokus-eingabefeld.png), [`G5.3-fokus-knopf.png`](G5.3-fokus-knopf.png) |
| G5.5, U4.2 Rückmeldungen und Meldungen beim Feld | [`ablauf/`](ablauf): Pflichtfelder, fehlender Beleg, falscher Dateityp, Falscheingaben, Bestätigungen |
| U2.4 Verlauf, U3.3 Filter und Sortierung, U3.4 Auswertung | `ablauf/06-…`, `ablauf/11-…`, `ablauf/12-…`, `ablauf/13-…` |
| LB-1 Export | [`export-beispiel.csv`](export-beispiel.csv) |

## Wie die Nachweise entstanden sind

- **Prozessdurchlauf:** Ein Skript mit Playwright steuerte Chrome durch den ganzen Ablauf mit allen drei Rollen
  (erfassen, Beleg hochladen, einreichen, zurückweisen, korrigieren, genehmigen, exportieren, auszahlen),
  machte die Screenshots bei 375 px Breite, mass die Seitenbreite und zeichnete alle Konsolenmeldungen auf.
- **W3C:** Das gerenderte HTML jeder Seite wurde mit dem Nu Html Checker (`vnu.jar` 26.11.20) geprüft, derselben
  Software, die auf validator.w3.org läuft. Weil die Seiten per JavaScript entstehen, wurde das HTML nach dem
  Laden gespeichert und geprüft.
- **Lighthouse 13** lief auf der Startseite (Anmeldung) in Chrome.

### Selbst nachprüfen

1. Anwendung starten (`npm run setup`, `npm start`), im Chrome die Seite öffnen.
2. **W3C:** DevTools → Elements → `<html>` rechts anklicken → *Copy* → *Copy outerHTML*, dann auf
   https://validator.w3.org/#validate_by_input einfügen und prüfen.
3. **375 px:** DevTools → Gerätesymbol → Breite 375.
4. **Konsole:** DevTools → Console, Prozess mit allen Rollen durchspielen.
5. **Lighthouse:** DevTools → Lighthouse → Kategorie Accessibility → *Analyze page load* auf der Startseite.
