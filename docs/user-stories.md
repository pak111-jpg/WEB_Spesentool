# Spesenportal – User Stories

**Fach:** DTR II / WEB I · **Projekt:** Digitales Spesenportal
**Gruppe:** Parwar Habasch, Felix Stalder, Pakierthan Pakeerathan

Verbindliche Fassung für WEB I. Grundlage ist unsere DTR-II-Abgabe (`dtr2/Spesenportal-User-Stories.pdf`).
Was wir für WEB I ergänzt haben, steht am Schluss unter [Änderungen gegenüber DTR II](#änderungen-gegenüber-dtr-ii).
Das Zustandsdiagramm steht in [`zustandsdiagramm.md`](zustandsdiagramm.md).

## 0. Vom Problem zur User Story

| Schritt | Unser Projekt |
| ------- | ------------- |
| Problem | Spesen laufen über Excel, Papierbelege und Mail. Dieselben Daten werden dreimal erfasst, Belege gehen verloren, niemand sieht den Freigabestatus, die Rückerstattung verzögert sich. |
| Nutzer | Mitarbeitende, Vorgesetzte, Lohnbuchhaltung |
| Ziel | Spesen einmal digital erfassen, digital freigeben, ohne Abtippen auszahlen |
| Nutzen | Weniger Aufwand, keine Rechen- und Tippfehler, jederzeit sichtbarer Status, pünktliche Auszahlung mit dem Lohn |

## 1. Nutzerrollen

| Rolle | Wer ist das? | Was will diese Rolle erreichen? |
| ----- | ------------ | ------------------------------- |
| **Mitarbeitende** | Alle Angestellten, die Auslagen haben (Fahrt, Verpflegung, Übernachtung, Material) | Spesen schnell und unterwegs erfassen, nichts verlieren, nicht rechnen müssen, wissen wo der Antrag liegt, pünktlich das Geld erhalten |
| **Vorgesetzte** | Team- und Abteilungsleitende, die Anträge freigeben | Übersicht statt Papierstapel, Belege am Bildschirm prüfen, schnell entscheiden, bei Fehlern gezielt zurückweisen |
| **Lohnbuchhaltung** | Personen, die die Rückerstattung über den Lohn auszahlen | Genehmigte Beträge ohne Abtippen übernehmen, Belege für die Revision nachweisen, nichts doppelt auszahlen |

## 2. User Stories

### 2.1 Mitarbeitende

| ID | User Story | Priorität |
| -- | ---------- | --------- |
| MA-1 | Als Mitarbeitende/r möchte ich einen Beleg direkt per Handyfoto erfassen, damit ich ihn nicht bis zum Monatsende aufbewahren muss und nichts verloren geht. | Must |
| MA-2 | Als Mitarbeitende/r möchte ich, dass das System Totale und Kilometerpauschalen automatisch berechnet, damit keine Rechenfehler entstehen und ich Zeit spare. | Must |
| MA-3 | Als Mitarbeitende/r möchte ich meine Monatsabrechnung mit einem Klick einreichen, damit ich nichts mehr ausdrucken und unterschreiben muss. | Must |
| MA-4 | Als Mitarbeitende/r möchte ich jederzeit den Status meines Antrags sehen, damit ich nicht per Mail nachfragen muss. | Must |
| MA-5 | Als Mitarbeitende/r möchte ich bei einer Rückweisung die Begründung sehen und nur die betroffene Position korrigieren, damit ich nicht die ganze Abrechnung neu erfassen muss. | Should |
| MA-6 | Als Mitarbeitende/r möchte ich den Verlauf meiner Abrechnung sehen (wer hat wann was entschieden), damit ich jeden Schritt nachvollziehen kann. | Should |

### 2.2 Vorgesetzte

| ID | User Story | Priorität |
| -- | ---------- | --------- |
| VG-1 | Als Vorgesetzte/r möchte ich alle eingereichten Anträge meines Teams in einer Liste sehen, damit ich nicht in Mails und Papierstapeln suchen muss. | Must |
| VG-2 | Als Vorgesetzte/r möchte ich einen Antrag mit den dazugehörigen Belegen am Bildschirm prüfen und genehmigen, damit keine Unterschrift auf Papier mehr nötig ist. | Must |
| VG-3 | Als Vorgesetzte/r möchte ich einen Antrag mit Begründung zurückweisen, damit die mitarbeitende Person genau weiss, was zu korrigieren ist. | Must |
| VG-4 | Als Vorgesetzte/r möchte ich sehen, welche Anträge länger als zwei Arbeitstage offen sind, damit ich die vereinbarte Frist einhalte. | Should |
| VG-5 | Als Vorgesetzte/r möchte ich die Anträge meines Teams nach Status und Person filtern und sortieren, damit ich frühere Entscheide schnell wiederfinde. | Should |

### 2.3 Lohnbuchhaltung

| ID | User Story | Priorität |
| -- | ---------- | --------- |
| LB-1 | Als Lohnbuchhaltung möchte ich alle genehmigten Abrechnungen eines Monats als Datei exportieren, damit ich die Beträge nicht ins Lohnsystem abtippen muss. | Must |
| LB-2 | Als Lohnbuchhaltung möchte ich zu jeder Position den Beleg einsehen, damit ich den Nachweis für die Revision ohne Rückfragen erbringen kann. | Must |
| LB-3 | Als Lohnbuchhaltung möchte ich ausbezahlte Abrechnungen als «ausbezahlt» markieren, damit keine Abrechnung zweimal ausbezahlt wird. | Must |
| LB-4 | Als Lohnbuchhaltung möchte ich die Spesen pro Kostenstelle auswerten, damit die Finanzabteilung die Kosten pro Abteilung sieht. | Could |
| LB-5 | Als Lohnbuchhaltung möchte ich am Monatsende alle genehmigten Abrechnungen eines Monats in einem Schritt als ausbezahlt markieren, damit ich nicht jede einzeln bearbeiten muss. | Should |

**Umfang:** 10 Must-, 5 Should- und 1 Could-Story. Für 3 Personen verlangt sind mindestens 7 Must-Stories mit je mindestens 2 Akzeptanzkriterien und 4 Should-Stories.

## 3. Akzeptanzkriterien

Jedes Kriterium lässt sich in der Anwendung mit Ja oder Nein prüfen.

### Must

**MA-1 – Beleg per Handyfoto erfassen**
- Zu jeder Position lässt sich ein Beleg als Foto (JPG, PNG, WebP, HEIC) oder PDF bis 10 MB hochladen; am Handy bietet die Dateiauswahl die Kamera an.
- Andere Dateitypen werden mit einer Meldung direkt beim Upload-Knopf abgewiesen.
- Der Beleg ist danach bei der Position mit «Beleg anzeigen» sichtbar und lässt sich ersetzen oder entfernen, solange die Abrechnung bearbeitbar ist.

**MA-2 – Totale und Kilometerpauschale automatisch**
- Bei der Kategorie «Fahrt» werden nur die Kilometer erfasst; das System rechnet Kilometer × Pauschale (CHF 0.70, einstellbar) und zeigt den Betrag schon bei der Eingabe als Vorschau.
- Das Total der Abrechnung wird aus allen Positionen berechnet und in der Liste und im Antrag angezeigt.
- Ein Betrag von 0 oder weniger und ein Datum ausserhalb des Abrechnungsmonats werden mit einer Meldung beim Feld abgewiesen.

**MA-3 – Monatsabrechnung einreichen**
- Einreichen ist nur möglich, wenn jede Position Datum, Betrag, Zweck und einen Beleg hat.
- Fehlt etwas, erscheint eine Fehlermeldung mit der betroffenen Position; der Antrag wird nicht eingereicht.
- Nach dem Einreichen hat der Antrag den Status «Eingereicht» und ist für die mitarbeitende Person gesperrt.
- Die zuständige vorgesetzte Person sieht den Antrag sofort in ihrer Liste.

**MA-4 – Antragsstatus einsehen**
- Die mitarbeitende Person sieht pro Monat genau einen der Zustände: Erfasst, Eingereicht, Zurückgewiesen, Genehmigt, Ausbezahlt, Abgelehnt.
- Bei «Zurückgewiesen» und «Abgelehnt» wird die Begründung angezeigt.
- Der Status wird unmittelbar nach der Entscheidung aktualisiert, ohne dass jemand nachfragen muss.

**VG-1 – Eingereichte Anträge des Teams**
- Die Liste zeigt alle Anträge mit Status «Eingereicht» der eigenen Teammitglieder, älteste zuerst.
- Anträge anderer Teams und noch nicht eingereichte Entwürfe sind nicht sichtbar.
- Pro Antrag sind Person, Monat, Total und Wartezeit sichtbar; ohne offene Anträge erscheint ein verständlicher Hinweis.

**VG-2 – Antrag prüfen und genehmigen**
- Die Liste zeigt nur Anträge mit Status «Eingereicht» aus dem eigenen Team.
- Pro Position sind Betrag, Zweck und Beleg ohne Download sichtbar.
- Nach dem Genehmigen wechselt der Status auf «Genehmigt» und der Antrag verschwindet aus der Liste der offenen Anträge.
- Eine genehmigte Abrechnung kann nicht mehr verändert werden.

**VG-3 – Antrag zurückweisen**
- Zurückweisen ist nur mit einer Begründung möglich (Pflichtfeld).
- Der Antrag wechselt auf «Zurückgewiesen» und ist für die mitarbeitende Person wieder bearbeitbar.
- Die mitarbeitende Person wird benachrichtigt (Hinweis auf ihrer Startseite «Meine Abrechnungen») und sieht die Begründung.
- Nach dem Korrigieren kann derselbe Antrag erneut eingereicht werden (keine Neuerfassung).

**LB-1 – Genehmigte Abrechnungen exportieren**
- Der Export enthält ausschliesslich Abrechnungen mit Status «Genehmigt» des gewählten Monats.
- Pro Zeile sind Personalnummer, Monat, Totalbetrag und Kostenstelle enthalten.
- Bereits ausbezahlte Abrechnungen erscheinen nicht erneut im Export.
- Der Export ist als Datei herunterladbar und maschinell einlesbar (CSV).

**LB-2 – Beleg pro Position einsehen**
- In der Detailansicht ist zu jeder Position der Beleg per Klick sichtbar (Bild oder PDF, ohne Download).
- Die Lohnbuchhaltung sieht nur genehmigte und ausbezahlte Abrechnungen.
- Der Verlauf zeigt, wer wann eingereicht, genehmigt und ausbezahlt hat.

**LB-3 – Als ausbezahlt markieren**
- Nur genehmigte Abrechnungen können als «ausbezahlt» markiert werden.
- Nach der Markierung ist der Zustand «Ausbezahlt» und damit ein Endzustand erreicht.
- Eine bereits ausbezahlte Abrechnung lässt sich kein zweites Mal markieren oder exportieren.

### Should

**MA-5 – Nur die betroffene Position korrigieren**
- Bei «Zurückgewiesen» ist die Begründung im Antrag und in der Liste sichtbar.
- Einzelne Positionen lassen sich bearbeiten, ohne die anderen neu zu erfassen.
- Derselbe Antrag wird danach erneut eingereicht.

**MA-6 – Verlauf sehen**
- Jede Statusänderung erscheint mit Zeitpunkt, Person und Rolle, älteste zuerst.
- Begründungen von Rückweisung und Ablehnung stehen im Verlauf.
- Der Verlauf bleibt auch nach erneutem Einreichen vollständig erhalten.

**VG-4 – Frist von zwei Arbeitstagen**
- Anträge, die länger als zwei Arbeitstage (Montag bis Freitag) offen sind, sind als «Überfällig» markiert.
- Ein Filter zeigt nur die überfälligen Anträge.

**VG-5 – Team-Historie filtern und sortieren**
- Die Liste lässt sich gleichzeitig nach Status und Person filtern.
- Ein Klick auf einen Spaltenkopf sortiert nach dieser Spalte, ein zweiter Klick kehrt die Richtung um.
- Es erscheinen nur Anträge des eigenen Teams und keine Entwürfe.

**LB-5 – Monat auf einmal auszahlen**
- Markiert werden nur Abrechnungen mit Status «Genehmigt» des gewählten Monats; vorher kommt eine Rückfrage.
- Die Anzahl der markierten Abrechnungen wird angezeigt.
- Jede markierte Abrechnung erhält einen Eintrag im Verlauf.

### Could

**LB-4 – Auswertung pro Kostenstelle**
- Pro Kostenstelle werden Anzahl Abrechnungen, Anzahl Positionen und Total des gewählten Monats angezeigt, mit Summenzeile.
- Gezählt werden nur genehmigte und ausbezahlte Abrechnungen.

## 4. Priorisierung (MoSCoW) mit Begründung

**Must – ohne das funktioniert der Kern nicht**

| ID | Begründung |
| -- | ---------- |
| MA-1 | Ohne digitale Belege bleibt der Papierprozess bestehen; genau er ist das Problem. |
| MA-2 | Das automatische Rechnen ist der Hauptgrund, warum die Erfassung von 45 auf unter 10 Minuten sinkt. |
| MA-3 | Ohne Einreichen gibt es keinen Workflow, sondern nur ein digitales Formular. |
| MA-4 | Der fehlende Status ist eines der drei Kernprobleme aus der Ist-Analyse. |
| VG-1 | Ohne Übersicht über die offenen Anträge kann die vorgesetzte Person gar nicht arbeiten. |
| VG-2 | Die digitale Genehmigung ersetzt die Unterschrift auf Papier – das Kernstück des neuen Prozesses. |
| VG-3 | Ohne Rückweisung mit Begründung bliebe nur «genehmigen oder ablehnen»; Tippfehler würden zu Ablehnungen führen. |
| LB-1 | Das Abtippen in der Lohnbuchhaltung ist die dritte Mehrfacherfassung, die wir abschaffen wollen. |
| LB-2 | Ohne Belegnachweis ist der Prozess für die Revision nicht zulässig. |
| LB-3 | Ohne diese Markierung besteht das Risiko einer doppelten Auszahlung – ein finanzielles Risiko. |

**Should – wichtig, aber der Kern läuft auch ohne**

| ID | Begründung |
| -- | ---------- |
| MA-5 | Erhöht die Akzeptanz spürbar, aber eine Rückweisung liesse sich notfalls auch durch komplette Neuerfassung lösen. |
| MA-6 | Macht Entscheide nachvollziehbar; der aktuelle Status allein (MA-4) reicht für den Kern. |
| VG-4 | Hilft, die Frist von zwei Arbeitstagen einzuhalten; der Entscheid ist aber auch ohne Erinnerung möglich. |
| VG-5 | Spart Suchzeit bei Rückfragen; für den Entscheid über offene Anträge genügt VG-1. |
| LB-5 | Spart am Monatsende viele Klicks; einzeln markieren (LB-3) funktioniert aber auch. |

**Could – nützliches Extra**

| ID | Begründung |
| -- | ---------- |
| LB-4 | Die Auswertung pro Kostenstelle ist ein Zusatznutzen für die Finanzabteilung, aber für die Auszahlung nicht nötig. |

**Bewusst nicht aufgenommen** (ausserhalb des Projektumfangs): automatische Belegerkennung (OCR), Buchung von Reisen und Hotels, die Lohnabrechnung selbst sowie die direkte Schnittstelle zur Finanzbuchhaltung.

## 5. Verbindung zu den UML-Diagrammen

| User Story | Use Case | Zustand / Übergang |
| ---------- | -------- | ------------------ |
| MA-1, MA-2 | Spesen erfassen | Zustand «Erfasst» |
| MA-3 | Monatsabrechnung einreichen | `einreichen` → «Eingereicht» |
| MA-4, MA-6 | Antragsstatus einsehen | alle Zustände |
| VG-2 | Spesenantrag prüfen und entscheiden | `genehmigen` → «Genehmigt» |
| VG-3, MA-5 | Spesenantrag prüfen und entscheiden | `zurückweisen` → «Zurückgewiesen», `erneut einreichen` → «Eingereicht» |
| LB-1, LB-3, LB-5 | Genehmigte Abrechnungen exportieren | `Monatsende: Auszahlung mit Lohn` → «Ausbezahlt» |

## Änderungen gegenüber DTR II

Für WEB I haben wir die Spezifikation ergänzt, ohne bestehende Stories zu streichen:

1. **Akzeptanzkriterien für alle Must-Stories.** In DTR II hatten MA-3, MA-4, VG-2, VG-3, LB-1 und LB-3 Kriterien. Neu haben auch MA-1, MA-2, VG-1 und LB-2 je mindestens zwei, ebenso alle Should- und die Could-Story.
2. **Drei neue Should-Stories:** MA-6 (Verlauf), VG-5 (Team-Historie filtern und sortieren) und LB-5 (Monat auf einmal auszahlen). Damit ist der Mindestumfang für drei Personen (4 Should) erfüllt.
3. **VG-3 präzisiert:** Die Benachrichtigung erfolgt im Portal (Hinweis auf der Startseite), nicht per E-Mail, weil die Anwendung ohne Drittsysteme laufen muss.
4. **Zustandsdiagramm:** Der Pfeil «ablehnen» beginnt jetzt eindeutig bei «Eingereicht», und «löschen» (nur im Zustand «Erfasst») ist als Übergang eingezeichnet. Siehe `zustandsdiagramm.md`.
