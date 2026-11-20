/**
 * Zeigt einen Beleg (Bild oder PDF) in einem <dialog>, ohne Download (VG-2, LB-2).
 * Die Datei wird mit Token geladen und als Blob-URL eingebettet.
 */
import * as api from '../api.js';
import { el, knopf, zeigeMeldung } from '../dom.js';

function dialogBauen(beleg, url) {
  const inhalt = beleg.mimeType.startsWith('image/')
    ? el('img', { src: url, alt: `Beleg ${beleg.dateiname}` })
    : el('iframe', { src: url, title: `Beleg ${beleg.dateiname}` });
  const dialog = el('dialog', {
    className: 'beleg-dialog',
    ariaLabel: `Beleg ${beleg.dateiname}`,
  });
  const schliessen = knopf('Schliessen', 'sekundaer', () => dialog.close());
  const kopf = el(
    'div',
    { className: 'dialog-kopf' },
    el('strong', {}, beleg.dateiname),
    schliessen,
  );
  dialog.append(kopf, inhalt);
  dialog.addEventListener('close', () => {
    URL.revokeObjectURL(url); // Speicher freigeben
    dialog.remove();
  });
  return dialog;
}

/** Lädt den Beleg mit Token und öffnet ihn im Dialog; Fehler erscheinen in `meldung`. */
export async function belegAnzeigen(beleg, meldung) {
  let url;
  try {
    url = URL.createObjectURL(await api.belege.laden(beleg.id));
  } catch (fehler) {
    zeigeMeldung(meldung, api.fehlerText(fehler), 'fehler');
    return;
  }
  const dialog = dialogBauen(beleg, url);
  document.body.append(dialog);
  dialog.showModal();
}

/** Knopf «Beleg anzeigen» für eine Position mit Beleg. */
export function belegKnopf(beleg, meldung) {
  return knopf(
    'Beleg anzeigen',
    'leise',
    () => void belegAnzeigen(beleg, meldung),
  );
}
