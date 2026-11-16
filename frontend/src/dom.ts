/**
 * Kleine Helfer zum Bauen der Oberfläche ohne Framework.
 * Alles entsteht mit createElement und textContent, nie mit innerHTML,
 * damit Texte aus dem Backend (Zweck, Begründung) nie als HTML gedeutet werden.
 */
import { ALLE_STATUS, type AntragStatus, type Kategorie } from './typen';

type Kind = Node | string | null | undefined | false;

/**
 * Erzeugt ein Element, setzt Eigenschaften und hängt Kinder an.
 * Beispiel: el('button', { type: 'button', className: 'sekundaer' }, 'Löschen')
 * Strings werden als Text eingefügt. null, undefined und false werden übersprungen,
 * so lassen sich Kinder bedingt anhängen: `bearbeitbar && knopf`.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  eigenschaften: Partial<HTMLElementTagNameMap[K]> = {},
  ...kinder: Kind[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  Object.assign(element, eigenschaften);
  for (const kind of kinder) {
    if (kind !== null && kind !== undefined && kind !== false)
      element.append(kind);
  }
  return element;
}

/** Beschriftetes Formularfeld: <div class="feld"><label>…</label>{eingabe}</div> */
export function feld(
  beschriftung: string,
  eingabe: HTMLElement & { id: string },
): HTMLDivElement {
  return el(
    'div',
    { className: 'feld' },
    el('label', { htmlFor: eingabe.id }, beschriftung),
    eingabe,
  );
}

/** Auswahlliste aus (Wert, Text)-Paaren. */
export function auswahl(
  id: string,
  optionen: { wert: string; text: string }[],
  gewaehlt?: string,
): HTMLSelectElement {
  const select = el('select', { id, name: id });
  for (const option of optionen) {
    select.append(
      el(
        'option',
        { value: option.wert, selected: option.wert === gewaehlt },
        option.text,
      ),
    );
  }
  return select;
}

/** Tabelle mit Kopfzeile. Zellen mit der Klasse "zahl" werden rechtsbündig. */
export function tabelle(
  spalten: string[],
  zeilen: HTMLTableRowElement[],
): HTMLDivElement {
  const kopf = el(
    'tr',
    {},
    ...spalten.map((titel) => el('th', { scope: 'col' }, titel)),
  );
  return el(
    'div',
    { className: 'tabelle-rahmen' },
    el('table', {}, el('thead', {}, kopf), el('tbody', {}, ...zeilen)),
  );
}

export function zelle(klasse: string, ...inhalt: Kind[]): HTMLTableCellElement {
  return el('td', { className: klasse }, ...inhalt);
}

/** Meldungszeile unter einem Formular oder einer Aktion. art: '', 'erfolg', 'warnung', 'fehler' */
export function zeigeMeldung(ziel: HTMLElement, text: string, art = ''): void {
  ziel.textContent = text;
  ziel.className = 'meldung ' + art;
}

// ---------- Formatierung (Schweizer Schreibweise) ----------

export const chf = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
});

/** "2026-11-05" oder ISO-Zeitstempel -> "05.11.2026" (ohne Date, damit keine Zeitzonen-Verschiebung) */
export function datumCH(iso: string): string {
  const [jahr, monat, tag] = iso.slice(0, 10).split('-');
  return `${tag}.${monat}.${jahr}`;
}

/** ISO-Zeitstempel -> "05.11.2026, 14:12", null -> "-" */
export function zeitpunktCH(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** (2026, 11) -> "November 2026" */
export function monatName(jahr: number, monat: number): string {
  return new Date(jahr, monat - 1, 1).toLocaleDateString('de-CH', {
    month: 'long',
    year: 'numeric',
  });
}

/** Erster und letzter Tag eines Monats als YYYY-MM-DD, für min/max im Datumsfeld. */
export function monatsGrenzen(
  jahr: number,
  monat: number,
): { von: string; bis: string } {
  const mm = String(monat).padStart(2, '0');
  const letzterTag = new Date(jahr, monat, 0).getDate();
  return {
    von: `${jahr}-${mm}-01`,
    bis: `${jahr}-${mm}-${String(letzterTag).padStart(2, '0')}`,
  };
}

/** Heutiges Datum als YYYY-MM-DD in Ortszeit. */
export function heuteIso(): string {
  return new Date().toLocaleDateString('sv-SE');
}

export const STATUS_TEXT: Record<AntragStatus, string> = {
  ERFASST: 'In Erfassung',
  EINGEREICHT: 'Eingereicht',
  ZURUECKGEWIESEN: 'Zurückgewiesen',
  GENEHMIGT: 'Genehmigt',
  AUSBEZAHLT: 'Ausbezahlt',
  ABGELEHNT: 'Abgelehnt',
};

export const KATEGORIE_TEXT: Record<Kategorie, string> = {
  FAHRT: 'Fahrt',
  VERPFLEGUNG: 'Verpflegung',
  UEBERNACHTUNG: 'Übernachtung',
  MATERIAL: 'Material',
};

/** Farbige Status-Marke, Farbe über die CSS-Klasse status-<status>. */
export function statusMarke(status: AntragStatus): HTMLSpanElement {
  return el(
    'span',
    { className: `status status-${status.toLowerCase()}` },
    STATUS_TEXT[status],
  );
}

/** Lässt den Browser eine Datei speichern (CSV-Export). */
export function dateiSpeichern(inhalt: Blob, dateiname: string): void {
  const url = URL.createObjectURL(inhalt);
  const link = el('a', { href: url, download: dateiname });
  document.body.append(link); // Firefox braucht den Link im Dokument
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // erst freigeben, wenn der Download gestartet ist
}

/** Auswahlliste der zwölf Monate mit deutschen Namen, Werte "1" bis "12". */
export function monatAuswahl(id: string, gewaehlt: number): HTMLSelectElement {
  const monate = Array.from({ length: 12 }, (_, i) => ({
    wert: String(i + 1),
    text: new Date(2000, i, 1).toLocaleDateString('de-CH', { month: 'long' }),
  }));
  return auswahl(id, monate, String(gewaehlt));
}

/** Zahlenfeld für das Jahr, vorbelegt. */
export function jahrFeld(id: string, wert: number): HTMLInputElement {
  return el('input', {
    id,
    name: id,
    type: 'number',
    min: '2000',
    max: '2100',
    required: true,
    value: String(wert),
  });
}

/** Statuswerte als Optionen für Auswahllisten. */
export const ALLE_STATUS_OPTIONEN = ALLE_STATUS.map((status) => ({
  wert: status,
  text: STATUS_TEXT[status],
}));
