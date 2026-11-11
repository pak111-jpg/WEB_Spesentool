import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Braucht eine laufende Datenbank mit Seed-Daten:
 *   npm run db:up && npm run db:migrate && npm run db:seed
 */
describe('Spesenportal API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /antraege ohne Token → 401', () => {
    return request(app.getHttpServer()).get('/antraege').expect(401);
  });

  it('POST /auth/login mit falschem Passwort → 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'anna.meier@firma.ch', passwort: 'falsch' })
      .expect(401);
  });

  it('Login als Mitarbeitende, eigene Anträge laden, Freigabe verboten', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'anna.meier@firma.ch', passwort: 'passwort' })
      .expect(200);
    const token = (login.body as { accessToken: string }).accessToken;
    expect(token).toBeDefined();

    const antraege = await request(app.getHttpServer())
      .get('/antraege')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(antraege.body)).toBe(true);

    await request(app.getHttpServer())
      .get('/freigabe/offen')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
