/**
 * Sortieren und Filtern von Listen im Browser. Reine Funktionen ohne DOM,
 * damit dieselbe Logik in allen Listen gilt (U3.3).
 * Auf- oder absteigend.
 * @typedef {'auf' | 'ab'} Richtung
 */

/**
 * Sortierwert eines Eintrags: Text oder Zahl.
 * @template T
 * @typedef {(eintrag: T) => string | number} SortWert
 */

/** Neue, sortierte Kopie der Liste (die Originalliste bleibt unverändert). */
export function sortieren(eintraege, wert, richtung) {
  const faktor = richtung === 'auf' ? 1 : -1;
  return [...eintraege].sort((a, b) => {
    const wa = wert(a);
    const wb = wert(b);
    const vergleich =
      typeof wa === 'number' && typeof wb === 'number'
        ? wa - wb
        : String(wa).localeCompare(String(wb), 'de-CH');
    return vergleich * faktor;
  });
}

/**
 * Ein Filter: true, wenn der Eintrag sichtbar bleiben soll.
 * @template T
 * @typedef {(eintrag: T) => boolean} Filter
 */

/** Behält nur Einträge, die alle Filter erfüllen (Filter sind kombiniert). */
export function filtern(eintraege, filter) {
  return eintraege.filter((eintrag) => filter.every((f) => f(eintrag)));
}

/** Filter, der nur greift, wenn ein Wert gewählt ist ('' = alle). */
export function gleichWennGewaehlt(gewaehlt, wert) {
  return (eintrag) => gewaehlt === '' || String(wert(eintrag)) === gewaehlt;
}
