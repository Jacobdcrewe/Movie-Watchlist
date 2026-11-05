import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo-name>/ — the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  // Read .env from the repo root. TMDB_READ_TOKEN is accepted as-is so an existing .env keeps working.
  envDir: '..',
  envPrefix: ['VITE_', 'TMDB_READ_TOKEN'],
  server: {
    port: 5173,
    fs: { allow: ['..'] },
  },
  test: { environment: 'node' },
});
