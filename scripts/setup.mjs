/**
 * Ersteinrichtung in einem Schritt (läuft unter Windows, macOS und Linux):
 * backend/.env anlegen, Pakete installieren, Datenbank starten, Tabellen anlegen, Demo-Daten laden.
 * Aufruf im Hauptordner: npm run setup
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

function schritt(titel, befehl, ordner = '.') {
  console.log(`\n▶ ${titel}\n  ${befehl}`);
  execSync(befehl, { cwd: ordner, stdio: 'inherit' });
}

function warten(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

if (!existsSync('backend/.env')) {
  copyFileSync('backend/.env.example', 'backend/.env');
  console.log('✔ backend/.env aus .env.example angelegt');
}

schritt('Pakete Backend installieren', 'npm install', 'backend');
schritt('Pakete Frontend installieren', 'npm install', 'frontend');
schritt('Datenbank (MariaDB in Docker) starten', 'docker compose up -d', 'backend');

// Die Datenbank braucht nach dem Start einige Sekunden; Migration bis zu 12-mal versuchen
for (let versuch = 1; ; versuch++) {
  try {
    schritt('Tabellen anlegen', 'npx prisma migrate deploy', 'backend');
    break;
  } catch (fehler) {
    if (versuch >= 12) throw fehler;
    console.log('  Datenbank noch nicht bereit, neuer Versuch in 5 Sekunden …');
    warten(5000);
  }
}

schritt('Demo-Daten laden', 'npm run db:seed', 'backend');
console.log('\n✔ Fertig. Starten mit: npm start   →   http://localhost:5173');
