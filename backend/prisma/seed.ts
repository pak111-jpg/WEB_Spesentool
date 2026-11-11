/**
 * Demo-Daten für Entwicklung und Frontend-Tests.
 * Ausführen: npm run db:seed  (löscht und befüllt die Tabellen neu)
 *
 * Alle Demo-Personen haben das Passwort «passwort».
 */
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hash } from 'bcryptjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client';
import { AntragStatus, Kategorie, Rolle } from '../src/generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
});
const KILOMETERPAUSCHALE = Number(process.env.KILOMETERPAUSCHALE_CHF ?? '0.70');
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? 'uploads');

// 1×1 Pixel PNG als Platzhalter-Beleg
const DEMO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

function tageVorher(tage: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - tage);
  return d;
}

async function main() {
  await prisma.beleg.deleteMany();
  await prisma.position.deleteMany();
  await prisma.spesenantrag.deleteMany();
  await prisma.user.deleteMany();

  const passwortHash = await hash('passwort', 10);

  const beat = await prisma.user.create({
    data: {
      personalnummer: 'P-2001',
      email: 'beat.keller@firma.ch',
      name: 'Beat Keller',
      rolle: Rolle.VORGESETZTE,
      kostenstelle: 'KST-100',
      passwortHash,
    },
  });
  const anna = await prisma.user.create({
    data: {
      personalnummer: 'P-1001',
      email: 'anna.meier@firma.ch',
      name: 'Anna Meier',
      rolle: Rolle.MITARBEITENDE,
      kostenstelle: 'KST-100',
      vorgesetzteId: beat.id,
      passwortHash,
    },
  });
  const carla = await prisma.user.create({
    data: {
      personalnummer: 'P-1002',
      email: 'carla.huber@firma.ch',
      name: 'Carla Huber',
      rolle: Rolle.MITARBEITENDE,
      kostenstelle: 'KST-200',
      vorgesetzteId: beat.id,
      passwortHash,
    },
  });
  await prisma.user.create({
    data: {
      personalnummer: 'P-3001',
      email: 'lena.schmid@firma.ch',
      name: 'Lena Schmid',
      rolle: Rolle.LOHNBUCHHALTUNG,
      kostenstelle: 'KST-900',
      passwortHash,
    },
  });

  // Platzhalter-Belegdatei
  await mkdir(UPLOAD_DIR, { recursive: true });
  const belegPfad = 'demo-beleg.png';
  await writeFile(join(UPLOAD_DIR, belegPfad), DEMO_PNG);
  const demoBeleg = {
    dateiname: 'demo-beleg.png',
    mimeType: 'image/png',
    groesse: DEMO_PNG.length,
    pfad: belegPfad,
  };

  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const monat = jetzt.getMonth() + 1;
  const datum = (tag: number) => new Date(Date.UTC(jahr, monat - 1, tag));

  // Anna: laufender Monat, noch in Erfassung (eine Position ohne Beleg → Einreichen scheitert bewusst)
  await prisma.spesenantrag.create({
    data: {
      mitarbeitendeId: anna.id,
      jahr,
      monat,
      status: AntragStatus.ERFASST,
      positionen: {
        create: [
          {
            datum: datum(3),
            kategorie: Kategorie.FAHRT,
            zweck: 'Kundenbesuch Zürich',
            kilometer: 42.5,
            betrag: Math.round(42.5 * KILOMETERPAUSCHALE * 100) / 100,
            beleg: { create: demoBeleg },
          },
          {
            datum: datum(3),
            kategorie: Kategorie.VERPFLEGUNG,
            zweck: 'Mittagessen Kundenbesuch Zürich',
            betrag: 24.9,
          },
        ],
      },
    },
  });

  // Carla: laufender Monat, vor 4 Tagen eingereicht → bei Beat als «überfällig» sichtbar
  await prisma.spesenantrag.create({
    data: {
      mitarbeitendeId: carla.id,
      jahr,
      monat,
      status: AntragStatus.EINGEREICHT,
      eingereichtAm: tageVorher(4),
      positionen: {
        create: [
          {
            datum: datum(2),
            kategorie: Kategorie.UEBERNACHTUNG,
            zweck: 'Hotel Messe Basel',
            betrag: 189,
            beleg: { create: demoBeleg },
          },
          {
            datum: datum(2),
            kategorie: Kategorie.MATERIAL,
            zweck: 'USB-Kabel für Präsentation',
            betrag: 19.95,
            beleg: { create: demoBeleg },
          },
        ],
      },
    },
  });

  // Vormonat: Anna genehmigt (bereit für den Export), Carla bereits ausbezahlt
  const vormonat = monat === 1 ? 12 : monat - 1;
  const vormonatJahr = monat === 1 ? jahr - 1 : jahr;
  const vmDatum = (tag: number) =>
    new Date(Date.UTC(vormonatJahr, vormonat - 1, tag));

  await prisma.spesenantrag.create({
    data: {
      mitarbeitendeId: anna.id,
      jahr: vormonatJahr,
      monat: vormonat,
      status: AntragStatus.GENEHMIGT,
      eingereichtAm: tageVorher(20),
      entschiedenVonId: beat.id,
      entschiedenAm: tageVorher(19),
      positionen: {
        create: [
          {
            datum: vmDatum(12),
            kategorie: Kategorie.FAHRT,
            zweck: 'Schulung Bern',
            kilometer: 120,
            betrag: Math.round(120 * KILOMETERPAUSCHALE * 100) / 100,
            beleg: { create: demoBeleg },
          },
        ],
      },
    },
  });
  await prisma.spesenantrag.create({
    data: {
      mitarbeitendeId: carla.id,
      jahr: vormonatJahr,
      monat: vormonat,
      status: AntragStatus.AUSBEZAHLT,
      eingereichtAm: tageVorher(25),
      entschiedenVonId: beat.id,
      entschiedenAm: tageVorher(24),
      ausbezahltAm: tageVorher(10),
      positionen: {
        create: [
          {
            datum: vmDatum(5),
            kategorie: Kategorie.VERPFLEGUNG,
            zweck: 'Teamlunch Projektabschluss',
            betrag: 68.4,
            beleg: { create: demoBeleg },
          },
        ],
      },
    },
  });

  console.log('Seed fertig. Logins (Passwort «passwort»):');
  console.log('  anna.meier@firma.ch   – MITARBEITENDE');
  console.log('  carla.huber@firma.ch  – MITARBEITENDE');
  console.log('  beat.keller@firma.ch  – VORGESETZTE');
  console.log('  lena.schmid@firma.ch  – LOHNBUCHHALTUNG');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
