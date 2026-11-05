import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { DB } from './db';
import { catalogRouter } from './routes/catalog';
import { settingsRouter } from './routes/settings';
import { errorHandler } from './routes/validation';
import { watchlistRouter } from './routes/watchlist';
import { CatalogService } from './services/catalog';
import { SettingsService, WatchlistService } from './services/watchlist';
import type { TmdbClient } from './tmdb/client';

export interface AppDeps {
  db: DB;
  tmdb: TmdbClient;
  /** Serve the built client from this folder, if it exists. */
  clientDist?: string;
  now?: () => number;
}

export function createApp({ db, tmdb, clientDist, now = Date.now }: AppDeps) {
  const catalog = new CatalogService(tmdb, db, now);
  const settings = new SettingsService(db);
  const watchlist = new WatchlistService(db, catalog, now);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, tmdbConfigured: tmdb.configured });
  });
  app.use('/api', catalogRouter(catalog));
  app.use('/api/watchlist', watchlistRouter(watchlist, settings));
  app.use('/api/settings', settingsRouter(settings));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (clientDist && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
