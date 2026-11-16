/**
 * Zeigt einen Beleg (Bild oder PDF) in einem <dialog>.
 * Die Datei wird mit Token geladen und als Blob-URL eingebettet.
 */
import * as api from '../api';
import { el, zeigeMeldung } from '../dom';
import type { Beleg } from '../typen';

export async function belegAnzeigen(
  beleg: Beleg,
  meldung: HTMLElement,
): Promise<void> {
  let url: string;
  try {
    url = URL.createObjectURL(await api.belege.laden(beleg.id));
  } catch (fehler) {
    zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    return;
  }

  const inhalt = beleg.mimeType.startsWith('image/')
    ? el('img', { src: url, alt: `Beleg ${beleg.dateiname}` })
    : el('iframe', { src: url, title: `Beleg ${beleg.dateiname}` });

  const schliessen = el(
    'button',
    { type: 'button', className: 'sekundaer' },
    'Schliessen',
  );
  const dialog = el(
    'dialog',
    { className: 'beleg-dialog' },
    el(
      'div',
      { className: 'dialog-kopf' },
      el('strong', {}, beleg.dateiname),
      schliessen,
    ),
    inhalt,
  );
  schliessen.onclick = () => dialog.close();
  dialog.onclose = () => {
    URL.revokeObjectURL(url); // Speicher freigeben
    dialog.remove();
  };
  document.body.append(dialog);
  dialog.showModal();
}

/** Knopf "Beleg anzeigen" für eine Position mit Beleg. */
export function belegKnopf(
  beleg: Beleg,
  meldung: HTMLElement,
): HTMLButtonElement {
  const knopf = el(
    'button',
    { type: 'button', className: 'leise' },
    'Beleg anzeigen',
  );
  knopf.onclick = () => void belegAnzeigen(beleg, meldung);
  return knopf;
}
