/**
 * Sortieren und Filtern von Listen im Browser. Reine Funktionen ohne DOM,
 * damit dieselbe Logik in allen Listen gilt (U3.3).
 */

/** Auf- oder absteigend. */
export type Richtung = 'auf' | 'ab';

/** Sortierwert eines Eintrags: Text oder Zahl. */
export type SortWert<T> = (eintrag: T) => string | number;

/** Neue, sortierte Kopie der Liste (die Originalliste bleibt unverändert). */
export function sortieren<T>(
  eintraege: T[],
  wert: SortWert<T>,
  richtung: Richtung,
): T[] {
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

/** Ein Filter: true, wenn der Eintrag sichtbar bleiben soll. */
export type Filter<T> = (eintrag: T) => boolean;

/** Behält nur Einträge, die alle Filter erfüllen (Filter sind kombiniert). */
export function filtern<T>(eintraege: T[], filter: Filter<T>[]): T[] {
  return eintraege.filter((eintrag) => filter.every((f) => f(eintrag)));
}

/** Filter, der nur greift, wenn ein Wert gewählt ist ('' = alle). */
export function gleichWennGewaehlt<T>(
  gewaehlt: string,
  wert: (eintrag: T) => string | number,
): Filter<T> {
  return (eintrag) => gewaehlt === '' || String(wert(eintrag)) === gewaehlt;
}
