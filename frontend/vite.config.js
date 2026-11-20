import { defineConfig } from 'vite';

// Vite dient nur als Entwicklungsserver: Er liefert index.html und die JavaScript-Module unverändert aus.
// Der Code braucht keinen Übersetzungsschritt und läuft auch auf jedem anderen Webserver.
export default defineConfig({
  server: { port: 5173, strictPort: true },
});
