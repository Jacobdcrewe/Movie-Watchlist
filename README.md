# Reel — Watchlist

A movie watchlist with live "where to watch" data for Canada, the US and the UK.
Search uses [TMDB](https://www.themoviedb.org/), and streaming, rent and buy availability comes from JustWatch via TMDB.
The UI is the "Frosted" glass design, with light and dark themes.

## Features
- Search movies as you type. With an empty search you see trending titles. Press `/` to focus search, `Enter` to add the top result, `Esc` to clear.
- Pick a region (CA / US / GB). Availability updates per region.
- **My services**: mark your subscriptions, then filter with "Only on my services".
- Tabs (To watch / Watched / All), genre chips, sort (recently added, rating, runtime, year, title), and grid or list view.
- A detail drawer with your 1–5 star rating, notes (autosaved), mark as watched, remove, and where to watch grouped into stream, rent and buy.
- The watchlist, ratings, notes and settings are stored in SQLite on the server.

## Getting started
1. Get a free TMDB API key: https://www.themoviedb.org/settings/api
2. Configure:
   ```sh
   cp .env.example .env    # then paste TMDB_READ_TOKEN (or TMDB_API_KEY)
   npm install
   ```
3. Run in development:
   ```sh
   npm run dev             # API on :3001, Vite on http://localhost:5173
   ```
4. Run in production:
   ```sh
   npm run build && npm start   # http://localhost:3001 serves the built client
   ```

`npm test` runs the server API tests (TMDB is mocked) and the client logic tests.

## Structure
```
shared/types.ts          Shared DTOs (Movie, Availability, WatchlistEntry, Settings)
server/src/
  app.ts                 Express app factory (routes, static client, errors)
  config.ts, index.ts    Env config and process entry
  db/                    SQLite (better-sqlite3) connection + schema
  tmdb/                  TMDB HTTP client (auth, TTL cache) + response mappers
  services/              CatalogService (search/trending/details/availability cache),
                         WatchlistService, SettingsService
  routes/                /api/search, /api/trending, /api/movies/:id, /api/providers,
                         /api/watchlist (GET/POST/PATCH/DELETE), /api/settings (GET/PUT)
client/src/
  api/client.ts          Typed API calls
  hooks/                 useWatchlist (optimistic), useSettings, useSearch (debounced),
                         useProviders, useHotkeys, useNarrow, useToast, usePersistentState
  lib/                   Pure helpers: filtering/sorting/summary, formatting, images, colours
  theme/                 Design tokens as CSS variables (dark/light + responsive layout)
  components/            Header, Toolbar, Filters, Movies (grid/list), Detail drawer
```

## Notes on data
- Availability is cached in SQLite per movie and region for 12 hours.
- TMDB/JustWatch don't publish rental prices or "leaving soon" dates, so the drawer shows providers and links to JustWatch for prices.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
