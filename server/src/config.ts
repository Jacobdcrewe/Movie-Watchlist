import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '../..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

export interface Config {
  port: number;
  tmdbReadToken: string;
  tmdbApiKey: string;
  tmdbBaseUrl: string;
  databasePath: string;
  clientDist: string;
  isProduction: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const dbPath = env.DATABASE_PATH || 'data/watchlist.db';
  return {
    port: Number(env.PORT) || 3001,
    tmdbReadToken: (env.TMDB_READ_TOKEN || '').trim(),
    tmdbApiKey: (env.TMDB_API_KEY || '').trim(),
    tmdbBaseUrl: (env.TMDB_BASE_URL || '').trim(),
    databasePath: dbPath === ':memory:' ? dbPath : path.resolve(ROOT_DIR, dbPath),
    clientDist: path.join(ROOT_DIR, 'client', 'dist'),
    isProduction: env.NODE_ENV === 'production',
  };
}
