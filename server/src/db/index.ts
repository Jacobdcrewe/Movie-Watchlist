import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS watchlist_items (
  tmdb_id    INTEGER PRIMARY KEY,
  added_at   INTEGER NOT NULL,
  watched    INTEGER NOT NULL DEFAULT 0,
  rating     INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  note       TEXT    NOT NULL DEFAULT '',
  movie_json TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS availability_cache (
  tmdb_id    INTEGER NOT NULL,
  region     TEXT    NOT NULL,
  json       TEXT    NOT NULL,
  fetched_at INTEGER NOT NULL,
  PRIMARY KEY (tmdb_id, region)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export function openDatabase(file: string): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
