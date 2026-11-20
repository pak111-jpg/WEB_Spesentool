/**
 * Inhalt der Demo-Daten: wer arbeitet wo, und welche Anträge gibt es mit welchem Verlauf.
 * Alle Personen und Firmen sind erfunden (keine echten Personendaten).
 * `vorTagen` zählt rückwärts ab heute, `monateZurueck` 0 = laufender Monat.
 */
import { AntragStatus, Kategorie, Rolle } from '../src/generated/prisma/enums';

const {
  ERFASST,
  EINGEREICHT,
  ZURUECKGEWIESEN,
  GENEHMIGT,
  AUSBEZAHLT,
  ABGELEHNT,
} = AntragStatus;
const { FAHRT, VERPFLEGUNG, UEBERNACHTUNG, MATERIAL } = Kategorie;

/** Eine Demo-Person; `vorgesetzte` verweist auf den Schlüssel der vorgesetzten Person. */
export interface PersonDaten {
  key: string;
  personalnummer: string;
  name: string;
  email: string;
  rolle: Rolle;
  kostenstelle: string;
  vorgesetzte?: string;
}

/** Eine Position; bei FAHRT zählen die Kilometer, sonst der Betrag. */
export interface PositionDaten {
  tag: number;
  kategorie: Kategorie;
  zweck: string;
  betrag?: number;
  km?: number;
  aussteller?: string;
  ohneBeleg?: boolean;
}

/** Ein Schritt im Lebenszyklus: neuer Status, wann und durch wen. */
export interface Schritt {
  nach: AntragStatus;
  vorTagen: number;
  durch: string;
  begruendung?: string;
}

/** Ein Antrag mit Positionen und den Schritten, die zu seinem Status geführt haben. */
export interface AntragDaten {
  person: string;
  monateZurueck: number;
  positionen: PositionDaten[];
  schritte: Schritt[];
}

/** 2 Vorgesetzte mit je einem Team, 5 Mitarbeitende, 1 Lohnbuchhaltung. */
export const PERSONEN: PersonDaten[] = [
  {
    key: 'beat',
    personalnummer: 'P-2001',
    name: 'Beat Keller',
    email: 'beat.keller@firma.ch',
    rolle: Rolle.VORGESETZTE,
    kostenstelle: 'KST-100',
  },
  {
    key: 'sandra',
    personalnummer: 'P-2002',
    name: 'Sandra Weber',
    email: 'sandra.weber@firma.ch',
    rolle: Rolle.VORGESETZTE,
    kostenstelle: 'KST-300',
  },
  {
    key: 'anna',
    personalnummer: 'P-1001',
    name: 'Anna Meier',
    email: 'anna.meier@firma.ch',
    rolle: Rolle.MITARBEITENDE,
    kostenstelle: 'KST-100',
    vorgesetzte: 'beat',
  },
  {
    key: 'carla',
    personalnummer: 'P-1002',
    name: 'Carla Huber',
    email: 'carla.huber@firma.ch',
    rolle: Rolle.MITARBEITENDE,
    kostenstelle: 'KST-200',
    vorgesetzte: 'beat',
  },
  {
    key: 'daniel',
    personalnummer: 'P-1003',
    name: 'Daniel Frei',
    email: 'daniel.frei@firma.ch',
    rolle: Rolle.MITARBEITENDE,
    kostenstelle: 'KST-100',
    vorgesetzte: 'beat',
  },
  {
    key: 'eva',
    personalnummer: 'P-1004',
    name: 'Eva Brunner',
    email: 'eva.brunner@firma.ch',
    rolle: Rolle.MITARBEITENDE,
    kostenstelle: 'KST-300',
    vorgesetzte: 'sandra',
  },
  {
    key: 'marco',
    personalnummer: 'P-1005',
    name: 'Marco Rossi',
    email: 'marco.rossi@firma.ch',
    rolle: Rolle.MITARBEITENDE,
    kostenstelle: 'KST-300',
    vorgesetzte: 'sandra',
  },
  {
    key: 'lena',
    personalnummer: 'P-3001',
    name: 'Lena Schmid',
    email: 'lena.schmid@firma.ch',
    rolle: Rolle.LOHNBUCHHALTUNG,
    kostenstelle: 'KST-900',
  },
];

/** 14 Anträge: 2 erfasst, 3 eingereicht, 1 zurückgewiesen, 2 genehmigt, 5 ausbezahlt, 1 abgelehnt. */
export const ANTRAEGE: AntragDaten[] = [
  // ---------- laufender Monat ----------
  {
    person: 'anna',
    monateZurueck: 0,
    positionen: [
      {
        tag: 3,
        kategorie: FAHRT,
        zweck: 'Kundenbesuch Muster AG, Zürich',
        km: 42.5,
      },
      // ohne Beleg: zeigt die Fehlermeldung beim Einreichen (MA-3)
      {
        tag: 3,
        kategorie: VERPFLEGUNG,
        zweck: 'Mittagessen mit Kunde, Zürich',
        betrag: 24.9,
        ohneBeleg: true,
      },
    ],
    schritte: [{ nach: ERFASST, vorTagen: 10, durch: 'anna' }],
  },
  {
    person: 'carla',
    monateZurueck: 0,
    positionen: [
      {
        tag: 2,
        kategorie: UEBERNACHTUNG,
        zweck: 'Hotel, Messe Swissbau Basel',
        betrag: 189,
        aussteller: 'Hotel Rheinblick Basel',
      },
      {
        tag: 2,
        kategorie: VERPFLEGUNG,
        zweck: 'Abendessen Messe Basel',
        betrag: 36.5,
        aussteller: 'Restaurant Messeplatz',
      },
      {
        tag: 3,
        kategorie: MATERIAL,
        zweck: 'USB-C-Adapter für Präsentation',
        betrag: 19.95,
        aussteller: 'Elektro Muster GmbH',
      },
    ],
    // vor 6 Tagen eingereicht: bei Beat als «überfällig» sichtbar (VG-4)
    schritte: [
      { nach: ERFASST, vorTagen: 12, durch: 'carla' },
      { nach: EINGEREICHT, vorTagen: 6, durch: 'carla' },
    ],
  },
  {
    person: 'daniel',
    monateZurueck: 0,
    positionen: [
      { tag: 5, kategorie: FAHRT, zweck: 'Baustellenbesuch Thun', km: 64 },
      {
        tag: 5,
        kategorie: VERPFLEGUNG,
        zweck: 'Mittagessen Baustelle Thun',
        betrag: 21.5,
        aussteller: 'Café Aare Thun',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 3, durch: 'daniel' },
      { nach: EINGEREICHT, vorTagen: 1, durch: 'daniel' },
    ],
  },
  {
    person: 'eva',
    monateZurueck: 0,
    positionen: [
      {
        tag: 4,
        kategorie: UEBERNACHTUNG,
        zweck: 'Hotel Lausanne, Kundenworkshop',
        betrag: 162,
        aussteller: 'Hôtel du Lac Lausanne',
      },
      {
        tag: 4,
        kategorie: FAHRT,
        zweck: 'Fahrt Bern – Lausanne – Bern',
        km: 210,
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 9, durch: 'eva' },
      { nach: EINGEREICHT, vorTagen: 7, durch: 'eva' },
      {
        nach: ZURUECKGEWIESEN,
        vorTagen: 5,
        durch: 'sandra',
        begruendung:
          'Auf dem Hotelbeleg fehlt die Rechnungsadresse der Firma. Bitte Rechnung auf die Firma ausstellen lassen und neu hochladen.',
      },
    ],
  },
  {
    person: 'marco',
    monateZurueck: 0,
    positionen: [
      {
        tag: 6,
        kategorie: MATERIAL,
        zweck: 'Flipchart-Papier für Workshop',
        betrag: 34.8,
        aussteller: 'Papeterie Muster',
      },
    ],
    schritte: [{ nach: ERFASST, vorTagen: 2, durch: 'marco' }],
  },
  // ---------- Vormonat ----------
  {
    person: 'anna',
    monateZurueck: 1,
    positionen: [
      { tag: 12, kategorie: FAHRT, zweck: 'Schulung Bern', km: 120 },
      {
        tag: 12,
        kategorie: VERPFLEGUNG,
        zweck: 'Mittagessen Schulung Bern',
        betrag: 27,
        aussteller: 'Restaurant Bundesplatz',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 30, durch: 'anna' },
      { nach: EINGEREICHT, vorTagen: 20, durch: 'anna' },
      { nach: GENEHMIGT, vorTagen: 19, durch: 'beat' },
    ],
  },
  {
    person: 'carla',
    monateZurueck: 1,
    positionen: [
      {
        tag: 5,
        kategorie: VERPFLEGUNG,
        zweck: 'Teamlunch Projektabschluss',
        betrag: 68.4,
        aussteller: 'Restaurant Linde',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 35, durch: 'carla' },
      { nach: EINGEREICHT, vorTagen: 25, durch: 'carla' },
      { nach: GENEHMIGT, vorTagen: 24, durch: 'beat' },
      { nach: AUSBEZAHLT, vorTagen: 10, durch: 'lena' },
    ],
  },
  {
    person: 'daniel',
    monateZurueck: 1,
    positionen: [
      {
        tag: 18,
        kategorie: VERPFLEGUNG,
        zweck: 'Abendessen mit Familie',
        betrag: 142,
        aussteller: 'Ristorante Muster',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 28, durch: 'daniel' },
      { nach: EINGEREICHT, vorTagen: 22, durch: 'daniel' },
      {
        nach: ABGELEHNT,
        vorTagen: 21,
        durch: 'beat',
        begruendung:
          'Privater Anlass, keine Geschäftsspesen. Kann nicht über das Spesenportal abgerechnet werden.',
      },
    ],
  },
  {
    person: 'eva',
    monateZurueck: 1,
    positionen: [
      {
        tag: 8,
        kategorie: MATERIAL,
        zweck: 'Fachbuch Projektmanagement',
        betrag: 54,
        aussteller: 'Buchhandlung Muster',
      },
      { tag: 15, kategorie: FAHRT, zweck: 'Kundentermin Luzern', km: 88 },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 33, durch: 'eva' },
      { nach: EINGEREICHT, vorTagen: 21, durch: 'eva' },
      { nach: GENEHMIGT, vorTagen: 18, durch: 'sandra' },
    ],
  },
  {
    person: 'marco',
    monateZurueck: 1,
    positionen: [
      {
        tag: 20,
        kategorie: UEBERNACHTUNG,
        zweck: 'Hotel Zürich, Fachkonferenz',
        betrag: 215,
        aussteller: 'Hotel Limmat Zürich',
      },
      {
        tag: 20,
        kategorie: VERPFLEGUNG,
        zweck: 'Abendessen Fachkonferenz',
        betrag: 45,
        aussteller: 'Zunfthaus Muster',
      },
    ],
    // zurückgewiesen, korrigiert und erneut eingereicht (MA-5, VG-3)
    schritte: [
      { nach: ERFASST, vorTagen: 26, durch: 'marco' },
      { nach: EINGEREICHT, vorTagen: 15, durch: 'marco' },
      {
        nach: ZURUECKGEWIESEN,
        vorTagen: 13,
        durch: 'sandra',
        begruendung:
          'Betrag beim Abendessen stimmt nicht mit dem Beleg überein. Bitte korrigieren.',
      },
      { nach: EINGEREICHT, vorTagen: 2, durch: 'marco' },
    ],
  },
  // ---------- vor zwei Monaten, alles ausbezahlt ----------
  {
    person: 'anna',
    monateZurueck: 2,
    positionen: [
      {
        tag: 9,
        kategorie: FAHRT,
        zweck: 'Lieferantentermin Winterthur',
        km: 56,
      },
      {
        tag: 9,
        kategorie: VERPFLEGUNG,
        zweck: 'Mittagessen mit Lieferant',
        betrag: 31.5,
        aussteller: 'Restaurant Stadthaus',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 60, durch: 'anna' },
      { nach: EINGEREICHT, vorTagen: 50, durch: 'anna' },
      { nach: GENEHMIGT, vorTagen: 49, durch: 'beat' },
      { nach: AUSBEZAHLT, vorTagen: 40, durch: 'lena' },
    ],
  },
  {
    person: 'carla',
    monateZurueck: 2,
    positionen: [
      {
        tag: 14,
        kategorie: MATERIAL,
        zweck: 'Druck Schulungsunterlagen',
        betrag: 86,
        aussteller: 'Copy Center Muster',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 62, durch: 'carla' },
      { nach: EINGEREICHT, vorTagen: 51, durch: 'carla' },
      { nach: GENEHMIGT, vorTagen: 48, durch: 'beat' },
      { nach: AUSBEZAHLT, vorTagen: 40, durch: 'lena' },
    ],
  },
  {
    person: 'daniel',
    monateZurueck: 2,
    positionen: [{ tag: 7, kategorie: FAHRT, zweck: 'Baustelle Biel', km: 72 }],
    schritte: [
      { nach: ERFASST, vorTagen: 58, durch: 'daniel' },
      { nach: EINGEREICHT, vorTagen: 52, durch: 'daniel' },
      { nach: GENEHMIGT, vorTagen: 50, durch: 'beat' },
      { nach: AUSBEZAHLT, vorTagen: 40, durch: 'lena' },
    ],
  },
  {
    person: 'eva',
    monateZurueck: 2,
    positionen: [
      {
        tag: 21,
        kategorie: VERPFLEGUNG,
        zweck: 'Kundenapéro Bern',
        betrag: 96,
        aussteller: 'Bar Muster Bern',
      },
    ],
    schritte: [
      { nach: ERFASST, vorTagen: 55, durch: 'eva' },
      { nach: EINGEREICHT, vorTagen: 47, durch: 'eva' },
      { nach: GENEHMIGT, vorTagen: 45, durch: 'sandra' },
      { nach: AUSBEZAHLT, vorTagen: 40, durch: 'lena' },
    ],
  },
];
