import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Spielt den ganzen Prozess über die REST-API durch.
 * Braucht eine laufende Datenbank mit Seed-Daten:
 *   npm run db:up && npm run db:migrate && npm run db:seed
 * Der Test legt eine Abrechnung für Januar 2025 an und löscht sie am Ende wieder.
 */
describe('Spesenportal API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tokens: Record<string, string> = {};
  let testAntragId: number | undefined;

  const api = () => request(app.getHttpServer());

  async function anmelden(email: string): Promise<string> {
    const antwort = await api()
      .post('/auth/login')
      .send({ email, passwort: 'passwort' })
      .expect(200);
    return (antwort.body as { accessToken: string }).accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    tokens.anna = await anmelden('anna.meier@firma.ch');
    tokens.beat = await anmelden('beat.keller@firma.ch');
    tokens.sandra = await anmelden('sandra.weber@firma.ch');
    tokens.lena = await anmelden('lena.schmid@firma.ch');
  });

  afterAll(async () => {
    if (testAntragId) {
      await prisma.spesenantrag.delete({ where: { id: testAntragId } });
    }
    await app.close();
  });

  it('ohne Token → 401, falsches Passwort → 401', async () => {
    await api().get('/antraege').expect(401);
    await api()
      .post('/auth/login')
      .send({ email: 'anna.meier@firma.ch', passwort: 'falsch' })
      .expect(401);
  });

  it('Rollen: Mitarbeitende dürfen nicht freigeben, Vorgesetzte nicht exportieren', async () => {
    await api()
      .get('/freigabe/offen')
      .set('Authorization', `Bearer ${tokens.anna}`)
      .expect(403);
    await api()
      .get('/lohnbuchhaltung/export?jahr=2026&monat=1')
      .set('Authorization', `Bearer ${tokens.beat}`)
      .expect(403);
  });

  it('Vorgesetzte sehen nur ihr Team und keine Entwürfe', async () => {
    const antwort = await api()
      .get('/freigabe/antraege')
      .set('Authorization', `Bearer ${tokens.sandra}`)
      .expect(200);
    const antraege = antwort.body as {
      status: string;
      mitarbeitende: { name: string };
    }[];
    expect(antraege.length).toBeGreaterThan(0);
    for (const antrag of antraege) {
      expect(antrag.status).not.toBe('ERFASST');
      expect(['Eva Brunner', 'Marco Rossi']).toContain(
        antrag.mitarbeitende.name,
      );
    }
  });

  it('ganzer Ablauf mit Verlauf, unzulässige Übergänge werden verhindert', async () => {
    const neu = await api()
      .post('/antraege')
      .set('Authorization', `Bearer ${tokens.anna}`)
      .send({ jahr: 2025, monat: 1 })
      .expect(201);
    testAntragId = (neu.body as { id: number }).id;
    const id = testAntragId;

    // Einreichen ohne Positionen scheitert mit der Liste der Probleme (MA-3)
    const leer = await api()
      .post(`/antraege/${id}/einreichen`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .expect(400);
    expect((leer.body as { probleme: unknown[] }).probleme).toHaveLength(1);

    // Fachliche Validierung: Datum ausserhalb des Monats, Betrag 0
    await api()
      .post(`/antraege/${id}/positionen`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .send({
        datum: '2025-02-01',
        kategorie: 'MATERIAL',
        zweck: 'Test',
        betrag: 10,
      })
      .expect(400);
    await api()
      .post(`/antraege/${id}/positionen`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .send({
        datum: '2025-01-10',
        kategorie: 'MATERIAL',
        zweck: 'Test',
        betrag: 0,
      })
      .expect(400);

    // Fahrt: Betrag rechnet das System (MA-2)
    const position = await api()
      .post(`/antraege/${id}/positionen`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .send({
        datum: '2025-01-10',
        kategorie: 'FAHRT',
        zweck: 'Kundenbesuch',
        kilometer: 10,
      })
      .expect(201);
    const positionId = (position.body as { id: number; betrag: number }).id;
    expect((position.body as { betrag: number }).betrag).toBeCloseTo(7);

    await api()
      .post(`/positionen/${positionId}/beleg`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .attach('datei', Buffer.from('%PDF-1.4\n%%EOF\n'), {
        filename: 'beleg.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    await api()
      .post(`/antraege/${id}/einreichen`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .expect(200);

    // Unzulässig: ein eingereichter Antrag kann nicht mehr bearbeitet werden
    await api()
      .delete(`/positionen/${positionId}`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .expect(409);
    // Unzulässig: auszahlen, bevor genehmigt
    await api()
      .post(`/lohnbuchhaltung/abrechnungen/${id}/ausbezahlt`)
      .set('Authorization', `Bearer ${tokens.lena}`)
      .expect(409);
    // Fremdes Team: Sandra sieht Annas Antrag nicht
    await api()
      .post(`/freigabe/antraege/${id}/genehmigen`)
      .set('Authorization', `Bearer ${tokens.sandra}`)
      .expect(404);

    await api()
      .post(`/freigabe/antraege/${id}/genehmigen`)
      .set('Authorization', `Bearer ${tokens.beat}`)
      .expect(200);
    // Doppelklick: ein zweites Genehmigen wird abgewiesen
    await api()
      .post(`/freigabe/antraege/${id}/genehmigen`)
      .set('Authorization', `Bearer ${tokens.beat}`)
      .expect(409);
    // Unzulässig: genehmigt → zurückgewiesen
    await api()
      .post(`/freigabe/antraege/${id}/zurueckweisen`)
      .set('Authorization', `Bearer ${tokens.beat}`)
      .send({ begruendung: 'Zu spät gemerkt' })
      .expect(409);

    await api()
      .post(`/lohnbuchhaltung/abrechnungen/${id}/ausbezahlt`)
      .set('Authorization', `Bearer ${tokens.lena}`)
      .expect(200);
    await api()
      .post(`/lohnbuchhaltung/abrechnungen/${id}/ausbezahlt`)
      .set('Authorization', `Bearer ${tokens.lena}`)
      .expect(409);

    // Verlauf: jede Statusänderung mit Rolle (U2.4)
    const detail = await api()
      .get(`/antraege/${id}`)
      .set('Authorization', `Bearer ${tokens.anna}`)
      .expect(200);
    const verlauf = (
      detail.body as { verlauf: { nachStatus: string; rolle: string }[] }
    ).verlauf;
    expect(verlauf.map((e) => `${e.nachStatus}/${e.rolle}`)).toEqual([
      'ERFASST/MITARBEITENDE',
      'EINGEREICHT/MITARBEITENDE',
      'GENEHMIGT/VORGESETZTE',
      'AUSBEZAHLT/LOHNBUCHHALTUNG',
    ]);
  });
});
