/**
 * Mitarbeitende: ein Antrag mit seinen Positionen.
 * Solange der Antrag ERFASST oder ZURUECKGEWIESEN ist, können Positionen erfasst, geändert und
 * gelöscht, Belege hochgeladen und der Antrag eingereicht werden (MA-1, MA-2, MA-3, MA-5).
 */
import * as api from '../api';
import {
  chf,
  el,
  feld,
  heuteIso,
  auswahl,
  KATEGORIE_TEXT,
  monatsGrenzen,
  zeigeMeldung,
} from '../dom';
import { antragKopf, positionenTabelle } from '../komponenten/antrag-ansicht';
import { navigiere, neuLaden } from '../router';
import {
  ALLE_KATEGORIEN,
  type Kategorie,
  type Position,
  type PositionEingabe,
  type PositionFehler,
} from '../typen';

export async function antragDetailSeite([id]: string[]): Promise<HTMLElement> {
  const antragId = Number(id);
  const [antrag, pauschale] = await Promise.all([
    api.antraege.einer(antragId),
    api.positionen.kilometerpauschale(),
  ]);
  const bearbeitbar =
    antrag.status === 'ERFASST' || antrag.status === 'ZURUECKGEWIESEN';
  const meldung = el('p', { className: 'meldung', role: 'status' });

  // ---------- Formular für neue oder bestehende Position ----------
  const grenzen = monatsGrenzen(antrag.jahr, antrag.monat);
  const datum = el('input', {
    id: 'f-datum',
    type: 'date',
    required: true,
    min: grenzen.von,
    max: grenzen.bis,
  });
  const kategorie = auswahl(
    'f-kategorie',
    ALLE_KATEGORIEN.map((k) => ({ wert: k, text: KATEGORIE_TEXT[k] })),
  );
  const zweck = el('input', {
    id: 'f-zweck',
    type: 'text',
    required: true,
    maxLength: 200,
  });
  const kilometer = el('input', {
    id: 'f-kilometer',
    type: 'number',
    min: '0.1',
    step: '0.1',
    inputMode: 'decimal',
  });
  const betrag = el('input', {
    id: 'f-betrag',
    type: 'number',
    min: '0.01',
    step: '0.01',
    inputMode: 'decimal',
  });
  const kilometerFeld = feld(
    `Kilometer (${chf.format(pauschale.chfProKilometer)} pro km)`,
    kilometer,
  );
  const betragFeld = feld('Betrag in CHF', betrag);
  const vorschau = el('p', { className: 'klein' });
  const speichern = el('button', { type: 'submit' }, 'Position speichern');
  const abbrechen = el(
    'button',
    { type: 'button', className: 'sekundaer' },
    'Abbrechen',
  );
  const formularTitel = el('h2', {}, 'Neue Position');
  const formularMeldung = el('p', { className: 'meldung', role: 'status' });
  let bearbeitet: Position | null = null; // null heisst: neue Position

  /** MA-2: Bei FAHRT zählt die Kilometerzahl, das Backend rechnet den Betrag. Sonst der Betrag. */
  function felderUmschalten(): void {
    const fahrt = kategorie.value === 'FAHRT';
    kilometerFeld.hidden = !fahrt;
    betragFeld.hidden = fahrt;
    kilometer.required = fahrt;
    betrag.required = !fahrt;
    vorschau.textContent =
      fahrt && kilometer.value
        ? `Ergibt ${chf.format(Number(kilometer.value) * pauschale.chfProKilometer)}`
        : '';
  }
  kategorie.onchange = felderUmschalten;
  kilometer.oninput = felderUmschalten;

  /** Formular leeren (neue Position) oder mit einer bestehenden Position füllen (Bearbeiten). */
  function formularFuellen(position: Position | null): void {
    bearbeitet = position;
    const heute = heuteIso();
    datum.value =
      position?.datum ??
      (heute >= grenzen.von && heute <= grenzen.bis ? heute : grenzen.von);
    kategorie.value = position?.kategorie ?? 'VERPFLEGUNG';
    zweck.value = position?.zweck ?? '';
    kilometer.value = position?.kilometer?.toString() ?? '';
    betrag.value =
      position && position.kategorie !== 'FAHRT' ? String(position.betrag) : '';
    formularTitel.textContent = position
      ? `Position vom ${position.datum.slice(8, 10)}. bearbeiten`
      : 'Neue Position';
    speichern.textContent = position
      ? 'Änderung speichern'
      : 'Position speichern';
    abbrechen.hidden = !position;
    felderUmschalten();
  }

  async function positionSpeichern(ereignis: SubmitEvent): Promise<void> {
    ereignis.preventDefault();
    const daten: PositionEingabe = {
      datum: datum.value,
      kategorie: kategorie.value as Kategorie,
      zweck: zweck.value.trim(),
    };
    if (daten.kategorie === 'FAHRT') daten.kilometer = Number(kilometer.value);
    else daten.betrag = Number(betrag.value);

    speichern.disabled = true;
    try {
      if (bearbeitet) await api.positionen.aktualisieren(bearbeitet.id, daten);
      else await api.positionen.erstellen(antrag.id, daten);
      await neuLaden();
    } catch (fehler) {
      zeigeMeldung(formularMeldung, api.fehlerText(fehler), 'fehler');
    } finally {
      speichern.disabled = false;
    }
  }

  const formular = el(
    'form',
    { className: 'formular' },
    feld('Datum', datum),
    feld('Kategorie', kategorie),
    feld('Zweck', zweck),
    kilometerFeld,
    betragFeld,
    vorschau,
    el('div', { className: 'knopfzeile' }, speichern, abbrechen),
    formularMeldung,
  );
  formular.onsubmit = (ereignis) => void positionSpeichern(ereignis);
  abbrechen.onclick = () => formularFuellen(null);
  formularFuellen(null);

  // ---------- Aktionen pro Position (nur solange bearbeitbar) ----------
  async function ausfuehren(aktion: () => Promise<unknown>): Promise<void> {
    try {
      await aktion();
      await neuLaden();
    } catch (fehler) {
      zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    }
  }

  function aktionen(position: Position): Node[] {
    const bearbeiten = el(
      'button',
      { type: 'button', className: 'leise' },
      'Bearbeiten',
    );
    bearbeiten.onclick = () => {
      formularFuellen(position);
      formular.scrollIntoView({ behavior: 'smooth' });
      zweck.focus();
    };

    const loeschen = el(
      'button',
      { type: 'button', className: 'leise gefahr' },
      'Löschen',
    );
    loeschen.onclick = () => {
      if (confirm(`Position "${position.zweck}" löschen?`)) {
        void ausfuehren(() => api.positionen.loeschen(position.id));
      }
    };

    // Datei-Upload: das <input type="file"> ist nur für Screenreader sichtbar, die Beschriftung sieht
    // aus wie ein Knopf. Ein Klick auf das Label öffnet die Dateiauswahl, am Handy auch die Kamera.
    const datei = el('input', {
      type: 'file',
      accept: 'image/*,application/pdf',
      className: 'nur-screenreader',
    });
    datei.onchange = () => {
      const gewaehlt = datei.files?.[0];
      if (gewaehlt)
        void ausfuehren(() => api.belege.hochladen(position.id, gewaehlt));
    };
    const hochladen = el(
      'label',
      { className: 'leise' },
      position.beleg ? 'Beleg ersetzen' : 'Beleg hochladen',
      datei,
    );

    const knoepfe: Node[] = [bearbeiten, hochladen];
    if (position.beleg) {
      const belegId = position.beleg.id;
      const belegEntfernen = el(
        'button',
        { type: 'button', className: 'leise' },
        'Beleg entfernen',
      );
      belegEntfernen.onclick = () =>
        void ausfuehren(() => api.belege.loeschen(belegId));
      knoepfe.push(belegEntfernen);
    }
    knoepfe.push(loeschen);
    return knoepfe;
  }

  // Die Tabelle steht in einer Box, damit sie nach einem fehlgeschlagenen Einreichen
  // mit den Problemen pro Position neu gezeichnet werden kann, ohne die Seite zu laden.
  const tabelleBox = el('div');
  function tabelleZeichnen(probleme: PositionFehler[] = []): void {
    tabelleBox.replaceChildren(
      positionenTabelle(
        antrag.positionen,
        meldung,
        bearbeitbar ? aktionen : undefined,
        probleme,
      ),
    );
  }
  tabelleZeichnen();

  // ---------- Aktionen für den ganzen Antrag ----------
  const einreichen = el('button', { type: 'button' }, 'Abrechnung einreichen');
  async function antragEinreichen(): Promise<void> {
    einreichen.disabled = true;
    try {
      await api.antraege.einreichen(antrag.id);
      await neuLaden();
    } catch (fehler) {
      // MA-3: 400 mit Liste der unvollständigen Positionen
      if (fehler instanceof api.ApiFehler && fehler.probleme.length > 0) {
        tabelleZeichnen(fehler.probleme);
        const allgemein = fehler.probleme.find((p) => p.positionId === null);
        zeigeMeldung(
          meldung,
          allgemein ? allgemein.fehler.join(', ') : fehler.message,
          'fehler',
        );
      } else {
        zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
      }
    } finally {
      einreichen.disabled = false;
    }
  }
  einreichen.onclick = () => void antragEinreichen();

  const antragLoeschen = el(
    'button',
    { type: 'button', className: 'sekundaer gefahr' },
    'Abrechnung löschen',
  );
  antragLoeschen.onclick = () => {
    if (confirm('Diese Abrechnung mit allen Positionen löschen?')) {
      void api.antraege
        .loeschen(antrag.id)
        .then(() => navigiere('#/antraege'))
        .catch((fehler: unknown) =>
          zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler'),
        );
    }
  };

  const antragAktionen = bearbeitbar
    ? el(
        'div',
        { className: 'knopfzeile' },
        einreichen,
        antrag.status === 'ERFASST' && antragLoeschen,
      )
    : el(
        'p',
        { className: 'klein' },
        'Diese Abrechnung ist eingereicht und kann nicht mehr bearbeitet werden.',
      );

  return el(
    'div',
    { className: 'seite' },
    el('a', { href: '#/antraege' }, 'Zurück zu meinen Abrechnungen'),
    el(
      'section',
      { className: 'karte' },
      antragKopf(antrag, false),
      el('h2', {}, 'Positionen'),
      tabelleBox,
      meldung,
      antragAktionen,
    ),
    bearbeitbar &&
      el('section', { className: 'karte' }, formularTitel, formular),
  );
}
