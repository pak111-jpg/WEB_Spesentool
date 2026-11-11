import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Spesenportal API')
    .setDescription(
      [
        'REST-API des digitalen Spesenportals (Fach DTR).',
        '',
        '**Rollen:** `MITARBEITENDE` erfassen Spesen und reichen die Monatsabrechnung ein, ',
        '`VORGESETZTE` prüfen und entscheiden (genehmigen / zurückweisen / ablehnen), ',
        '`LOHNBUCHHALTUNG` exportiert genehmigte Abrechnungen und markiert sie als ausbezahlt.',
        '',
        '**Lebenszyklus eines Antrags:** ERFASST → EINGEREICHT → GENEHMIGT → AUSBEZAHLT, ',
        'alternativ EINGEREICHT → ZURUECKGEWIESEN → (Korrektur) → EINGEREICHT oder EINGEREICHT → ABGELEHNT.',
        '',
        'Anmeldung über `POST /auth/login`, danach das JWT als Bearer-Token mitschicken (Button «Authorize»).',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Anmeldung und eigenes Profil')
    .addTag('antraege', 'Spesenanträge (Monatsabrechnungen) der Mitarbeitenden')
    .addTag('positionen', 'Einzelne Spesenpositionen eines Antrags')
    .addTag('belege', 'Belegdateien (Foto / PDF)')
    .addTag('freigabe', 'Prüfung und Entscheid durch Vorgesetzte')
    .addTag('lohnbuchhaltung', 'Export, Auszahlung und Auswertung')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `API läuft auf http://localhost:${port} – Swagger: http://localhost:${port}/api`,
  );
}
void bootstrap();
