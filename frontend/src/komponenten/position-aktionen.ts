/**
 * Knöpfe pro Position, solange die Abrechnung bearbeitbar ist:
 * Bearbeiten, Beleg hochladen oder ersetzen (MA-1), Beleg entfernen, Position löschen.
 */
import * as api from '../api';
import { el, knopf, zeigeMeldung } from '../dom';
import { merkeMeldung } from '../rueckmeldung';
import { neuLaden } from '../router';
import type { Position } from '../typen';
import { pruefeBeleg } from '../validierung';
import type { Aktionen } from './antrag-ansicht';

/** Führt eine Aktion aus, merkt sich die Bestätigung und zeichnet die Seite neu. */
async function ausfuehren(
  aktion: () => Promise<unknown>,
  bestaetigung: string,
  meldung: HTMLElement,
): Promise<void> {
  try {
    await aktion();
    merkeMeldung(bestaetigung);
    await neuLaden();
  } catch (fehler) {
    zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
  }
}

/**
 * Datei-Upload: Das <input type="file"> ist nur für Screenreader sichtbar, die Beschriftung sieht
 * aus wie ein Knopf. Am Handy bietet die Dateiauswahl auch die Kamera an. Ein falscher Dateityp
 * wird vor dem Hochladen abgefangen und direkt beim Knopf gemeldet.
 */
function belegHochladen(position: Position, meldung: HTMLElement): Node[] {
  const id = `beleg-${position.id}`;
  const fehler = el('span', { id: `${id}-fehler`, className: 'feld-fehler' });
  const datei = el('input', {
    id,
    type: 'file',
    accept: 'image/*,application/pdf',
    className: 'nur-screenreader',
  });
  datei.setAttribute('aria-describedby', fehler.id);
  datei.addEventListener('change', () => {
    const gewaehlt = datei.files?.[0];
    if (!gewaehlt) return;
    const problem = pruefeBeleg(gewaehlt);
    fehler.textContent = problem ?? '';
    if (problem === null) {
      void ausfuehren(
        () => api.belege.hochladen(position.id, gewaehlt),
        'Beleg hochgeladen.',
        meldung,
      );
    }
  });
  const text = position.beleg ? 'Beleg ersetzen' : 'Beleg hochladen';
  return [el('label', { className: 'leise' }, text, datei), fehler];
}

/** Liefert die Aktionen für die Positionstabelle; `bearbeiten` füllt das Formular. */
export function positionAktionen(
  bearbeiten: (position: Position) => void,
  meldung: HTMLElement,
): Aktionen {
  return (position) => {
    const knoepfe: Node[] = [
      knopf('Bearbeiten', 'leise', () => bearbeiten(position)),
    ];
    knoepfe.push(...belegHochladen(position, meldung));
    const beleg = position.beleg;
    if (beleg) {
      knoepfe.push(
        knopf(
          'Beleg entfernen',
          'leise',
          () =>
            void ausfuehren(
              () => api.belege.loeschen(beleg.id),
              'Beleg entfernt.',
              meldung,
            ),
        ),
      );
    }
    knoepfe.push(
      knopf('Löschen', 'leise gefahr', () => {
        if (confirm(`Position «${position.zweck}» löschen?`)) {
          void ausfuehren(
            () => api.positionen.loeschen(position.id),
            'Position gelöscht.',
            meldung,
          );
        }
      }),
    );
    return knoepfe;
  };
}
