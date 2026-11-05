# Reel — Watchlist

A private movie watchlist with live "where to watch" data for Canada, the US and the UK.
It's a static React site hosted on **GitHub Pages**:

- **Movie data:** the browser calls [TMDB](https://www.themoviedb.org/) directly. Streaming, rent and buy availability comes from JustWatch via TMDB and is cached in the browser for 12 hours.
- **Login and storage:** [Supabase](https://supabase.com) (free plan) handles email/password sign-in. The watchlist and settings live in Postgres tables protected by row-level security, so only your account can read or write your data.

## Features
- Search movies as you type, or see trending titles when the search is empty. Press `/` to focus search, `Enter` to add the top result, `Esc` to clear.
- Region picker (CA / US / GB), "My services", and "Only on my services".
- Tabs, genre chips, sort, and three views (Grid / List / Text) with a size slider.
- A detail drawer with your 1–5 star rating, autosaved notes, mark as watched, and where to watch.
- Light and dark themes. Your settings sync across devices through your account.

---

## One-time setup

### 1. Supabase (database and login)
1. Create a free project at https://supabase.com.
2. Go to **SQL Editor → New query**, paste in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Create your account: **Authentication → Users → Add user → Create new user**. Enter your email and a password, and tick **Auto Confirm User**.
4. Lock it down: **Authentication → Sign In / Providers**, then turn off **Allow new users to sign up**. Now nobody else can create an account. Even if they could, row-level security keeps every account's data separate.
5. Copy **Project Settings → API → Project URL** and the **anon public** key.

### 2. TMDB
Get the **API Read Access Token** from https://www.themoviedb.org/settings/api.

### 3. Local development
```sh
cp .env.example .env     # fill in VITE_TMDB_READ_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # http://localhost:5173
```

### 4. Deploy to GitHub Pages
1. On GitHub, open the repo → **Settings → Secrets and variables → Actions → New repository secret**. Add three secrets:
   `VITE_TMDB_READ_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (`VITE_SUPABASE_PUBLISHABLE_KEY` also works as the name for the key.)
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`, or run the workflow by hand from **Actions → Deploy to GitHub Pages → Run workflow**.
4. The site will be at `https://<your-username>.github.io/<repo-name>/`.

The workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) installs, tests, builds with the right base path, and publishes.

**About the keys in the browser:** all three values end up in the site's JavaScript, which is normal for a static site. The Supabase anon key is meant to be public, and row-level security is what protects your data. The TMDB token is read-only, so the worst case is someone using up your request quota.

---

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build to `client/dist` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (watchlist logic, TMDB mappers) |

## Structure
```
shared/types.ts            Domain types (Movie, Availability, WatchlistEntry, Settings)
supabase/schema.sql        Tables + row-level security policies
.github/workflows/         GitHub Pages deploy
client/src/
  Root.tsx                 Config check → sign-in → app
  auth/                    useAuth (Supabase session), LoginScreen
  data/                    tmdb.ts (HTTP + cache), tmdbMappers.ts, catalog.ts (search, trending,
                           details, providers, availability cache), repository.ts (Supabase CRUD),
                           supabase.ts (client)
  api/client.ts            The single data API the hooks use
  hooks/                   useWatchlist (optimistic), useSettings, useSearch, useProviders, …
  lib/                     Pure helpers: filtering/sorting/summary, formatting, images, colours
  theme/                   Design tokens as CSS variables (dark/light, responsive, scrollbars)
  components/              Header, Toolbar, Filters, Movies (grid/list/text), Detail drawer
```

Availability data is from JustWatch via TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
