import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  // Relative base so the build works under https://<user>.github.io/<repo>/
  base: './',
  plugins: [preact()],
  // Spotify only accepts loopback IPs (not "localhost") as http redirect URIs
  server: { host: '127.0.0.1', port: 5173 },
});
