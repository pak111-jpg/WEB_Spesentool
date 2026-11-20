/**
 * Demo-Daten: 8 Personen und 14 Spesenanträge in allen 6 Status, mit Verlauf und Musterbelegen.
 * Ausführen: npm run db:seed  (löscht und befüllt die Tabellen neu)
 *
 * Alle Personen, Firmen und Belege sind erfunden. Passwort überall «passwort».
 * Die Daten sind relativ zum heutigen Datum, damit «überfällig» und der laufende Monat stimmen.
 */
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hash } from 'bcryptjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { istUebergangErlaubt } from '../src/antraege/statusregeln';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { AntragStatus, Kategorie, Rolle } from '../src/generated/prisma/enums';
import { ANTRAEGE, AntragDaten, PERSONEN, PositionDaten } from './seed-daten';
import { belegPdf } from './seed-beleg';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});
const KILOMETERPAUSCHALE = Number(process.env.KILOMETERPAUSCHALE_CHF ?? '0.70');
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? 'uploads');
const TAG_MS = 24 * 60 * 60 * 1000;
const ENTSCHEIDE: AntragStatus[] = [
  AntragStatus.GENEHMIGT,
  AntragStatus.ZURUECKGEWIESEN,
  AntragStatus.ABGELEHNT,
];

type PersonIds = Record<string, { id: number; rolle: Rolle }>;

/** Zeitpunkt vor `tage` Tagen, um 9 Uhr plus `minuten`. */
function vorTagen(tage: number, minuten = 0): Date {
  const d = new Date(Date.now() - tage * TAG_MS);
  d.setHours(9, minuten, 0, 0);
  return d;
}

/** Jahr und Monat `zurueck` Monate vor dem laufenden Monat. */
function monatVor(zurueck: number): { jahr: number; monat: number } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - zurueck);
  return { jahr: d.getFullYear(), monat: d.getMonth() + 1 };
}

/** Datum einer Position; im laufenden Monat nie in der Zukunft. */
function positionsDatum(jahr: number, monat: number, tag: number): Date {
  const heute = new Date();
  const laufend =
    jahr === heute.getFullYear() && monat === heute.getMonth() + 1;
  const letzterTag = new Date(jahr, monat, 0).getDate();
  const tagImMonat = Math.min(tag, letzterTag, laufend ? heute.getDate() : 31);
  return new Date(Date.UTC(jahr, monat - 1, tagImMonat));
}

async function personenAnlegen(): Promise<PersonIds> {
  const passwortHash = await hash('passwort', 10);
  const ids: PersonIds = {};
  // Zuerst Vorgesetzte, damit ihre IDs für das Team bekannt sind
  const sortiert = [...PERSONEN].sort(
    (a, b) => Number(Boolean(a.vorgesetzte)) - Number(Boolean(b.vorgesetzte)),
  );
  for (const person of sortiert) {
    const user = await prisma.user.create({
      data: {
        personalnummer: person.personalnummer,
        email: person.email,
        name: person.name,
        rolle: person.rolle,
        kostenstelle: person.kostenstelle,
        vorgesetzteId: person.vorgesetzte ? ids[person.vorgesetzte].id : null,
        passwortHash,
      },
    });
    ids[person.key] = { id: user.id, rolle: user.rolle };
  }
  return ids;
}

/** Betrag einer Position: bei FAHRT Kilometer × Pauschale (wie im Backend, MA-2). */
function betragVon(position: PositionDaten): number {
  if (position.kategorie === Kategorie.FAHRT) {
    return Math.round((position.km ?? 0) * KILOMETERPAUSCHALE * 100) / 100;
  }
  return position.betrag ?? 0;
}

/** Textzeilen des Musterbelegs: Fahrtenbuch bei FAHRT, sonst Quittung. */
function belegZeilen(
  position: PositionDaten,
  datum: Date,
  betrag: number,
  nummer: number,
): string[] {
  const datumText = datum
    .toISOString()
    .slice(0, 10)
    .split('-')
    .reverse()
    .join('.');
  const total = `Total: CHF ${betrag.toFixed(2)}`;
  if (position.kategorie === Kategorie.FAHRT) {
    const pauschale = `Pauschale: CHF ${KILOMETERPAUSCHALE.toFixed(2)} pro km`;
    return [
      'Fahrtenbuch Privatfahrzeug',
      `Datum: ${datumText}`,
      position.zweck,
      `Kilometer: ${position.km}`,
      pauschale,
      total,
      '',
      'Musterbeleg (Testdaten)',
    ];
  }
  return [
    position.aussteller ?? 'Muster AG',
    'Musterstrasse 1, 3000 Bern',
    `Datum: ${datumText}`,
    `Beleg-Nr. ${10000 + nummer}`,
    position.zweck,
    total,
    'inkl. MWST 8.1 %',
    'MWST-Nr. CHE-000.000.000 MWST',
    '',
    'Musterbeleg (Testdaten)',
  ];
}

/** Schreibt einen Musterbeleg als PDF und liefert die Daten für den Beleg-Datensatz. */
async function belegSchreiben(
  position: PositionDaten,
  datum: Date,
  betrag: number,
  nummer: number,
) {
  const inhalt = belegPdf(belegZeilen(position, datum, betrag, nummer));
  const pfad = `seed-beleg-${nummer}.pdf`;
  await writeFile(join(UPLOAD_DIR, pfad), inhalt);
  return {
    dateiname: `beleg-${nummer}.pdf`,
    mimeType: 'application/pdf',
    groesse: inhalt.length,
    pfad,
  };
}

/** Prüft die Schritte gegen das Zustandsdiagramm, damit die Demo-Daten konsistent sind. */
function pruefeSchritte(antrag: AntragDaten): void {
  if (antrag.schritte[0].nach !== AntragStatus.ERFASST) {
    throw new Error(
      `Antrag von ${antrag.person}: erster Schritt muss ERFASST sein`,
    );
  }
  for (let i = 1; i < antrag.schritte.length; i++) {
    const von = antrag.schritte[i - 1].nach;
    const nach = antrag.schritte[i].nach;
    if (!istUebergangErlaubt(von, nach)) {
      throw new Error(
        `Antrag von ${antrag.person}: ${von} → ${nach} ist nicht erlaubt`,
      );
    }
  }
}

/** Leitet Status und Zeitstempel aus den Schritten ab (letzter Schritt = aktueller Status). */
function felderAusSchritten(antrag: AntragDaten, ids: PersonIds) {
  const { schritte } = antrag;
  const zeit = (i: number) => vorTagen(schritte[i].vorTagen, i);
  const letzterIndex = (status: AntragStatus) =>
    schritte.map((s) => s.nach).lastIndexOf(status);
  const eingereicht = letzterIndex(AntragStatus.EINGEREICHT);
  // Entscheid der Vorgesetzten nach dem letzten Einreichen (sonst gilt er nicht mehr)
  const entscheidIndex = schritte.findIndex(
    (s, i) => i > eingereicht && ENTSCHEIDE.includes(s.nach),
  );
  const ausbezahlt = letzterIndex(AntragStatus.AUSBEZAHLT);
  return {
    status: schritte[schritte.length - 1].nach,
    erstelltAm: zeit(0),
    eingereichtAm: eingereicht >= 0 ? zeit(eingereicht) : null,
    entschiedenVonId:
      entscheidIndex >= 0 ? ids[schritte[entscheidIndex].durch].id : null,
    entschiedenAm: entscheidIndex >= 0 ? zeit(entscheidIndex) : null,
    begruendung:
      entscheidIndex >= 0
        ? (schritte[entscheidIndex].begruendung ?? null)
        : null,
    ausbezahltVonId:
      ausbezahlt >= 0 ? ids[schritte[ausbezahlt].durch].id : null,
    ausbezahltAm: ausbezahlt >= 0 ? zeit(ausbezahlt) : null,
  };
}

/** Verlaufseinträge aus den Schritten (U2.4). */
function verlaufAusSchritten(antrag: AntragDaten, ids: PersonIds) {
  return antrag.schritte.map((schritt, i) => ({
    vonStatus: i === 0 ? null : antrag.schritte[i - 1].nach,
    nachStatus: schritt.nach,
    zeitpunkt: vorTagen(schritt.vorTagen, i),
    userId: ids[schritt.durch].id,
    rolle: ids[schritt.durch].rolle,
    begruendung: schritt.begruendung ?? null,
  }));
}

let belegNummer = 0;

async function antragAnlegen(
  antrag: AntragDaten,
  ids: PersonIds,
): Promise<void> {
  pruefeSchritte(antrag);
  const { jahr, monat } = monatVor(antrag.monateZurueck);
  const positionen: Prisma.PositionCreateWithoutAntragInput[] = [];
  for (const position of antrag.positionen) {
    const datum = positionsDatum(jahr, monat, position.tag);
    const betrag = betragVon(position);
    const beleg = position.ohneBeleg
      ? undefined
      : {
          create: await belegSchreiben(position, datum, betrag, ++belegNummer),
        };
    positionen.push({
      datum,
      kategorie: position.kategorie,
      zweck: position.zweck,
      kilometer: position.km ?? null,
      betrag,
      beleg,
    });
  }
  await prisma.spesenantrag.create({
    data: {
      mitarbeitendeId: ids[antrag.person].id,
      jahr,
      monat,
      ...felderAusSchritten(antrag, ids),
      positionen: { create: positionen },
      verlauf: { create: verlaufAusSchritten(antrag, ids) },
    },
  });
}

async function main(): Promise<void> {
  await prisma.statusAenderung.deleteMany();
  await prisma.beleg.deleteMany();
  await prisma.position.deleteMany();
  await prisma.spesenantrag.deleteMany();
  await prisma.user.deleteMany();
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ids = await personenAnlegen();
  for (const antrag of ANTRAEGE) {
    await antragAnlegen(antrag, ids);
  }

  const anzahl = await prisma.spesenantrag.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log(
    `Seed fertig: ${PERSONEN.length} Personen, ${ANTRAEGE.length} Anträge`,
  );
  anzahl.forEach((a) => console.log(`  ${a.status}: ${a._count}`));
  console.log('Logins (Passwort «passwort»):');
  PERSONEN.forEach((p) => console.log(`  ${p.email.padEnd(24)} ${p.rolle}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
