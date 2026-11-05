import { createApp } from './app';
import { loadConfig } from './config';
import { openDatabase } from './db';
import { TmdbClient } from './tmdb/client';

const config = loadConfig();
const db = openDatabase(config.databasePath);
const tmdb = new TmdbClient({
  readToken: config.tmdbReadToken,
  apiKey: config.tmdbApiKey,
  baseUrl: config.tmdbBaseUrl,
});

if (!tmdb.configured) {
  console.warn('\n  ⚠  No TMDB credentials found. Copy .env.example to .env and set TMDB_READ_TOKEN.\n');
}

const app = createApp({ db, tmdb, clientDist: config.isProduction ? config.clientDist : undefined });

const server = app.listen(config.port, () => {
  console.log(`Reel API listening on http://localhost:${config.port}`);
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
