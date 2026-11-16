import { defineConfig } from 'vite';

// Vite liefert im Entwicklungsmodus die Dateien aus und baut für die Abgabe ein statisches Bundle nach dist/.
// Das Backend läuft separat auf Port 3000 und erlaubt Anfragen von anderen Ursprüngen (CORS).
export default defineConfig({
  server: { port: 5173, strictPort: true },
});
