# Reel — Watchlist

A private movie watchlist with live "where to watch" data for Canada, the US and the UK.
It's a static React site hosted on **GitHub Pages**:

- **Movie data:** the browser calls [TMDB](https://www.themoviedb.org/) directly. Streaming, rent and buy availability comes from JustWatch via TMDB and is cached in the browser for 12 hours.
- **Accounts and storage:** [Supabase](https://supabase.com) (free plan) handles email/password sign-up and sign-in. Lists, movies and settings live in Postgres tables protected by row-level security, so people only ever see their own lists and lists shared with them.

## Features
- Search movies as you type, or see trending titles when the search is empty. Press `/` to focus search, `Enter` to add the top result, `Esc` to clear.
- Region picker (CA / US / GB), "My services", and "Only on my services".
- Tabs, genre chips, sort, and three views (Grid / List / Text) with a size slider.
- A detail drawer with your 1–5 star rating, autosaved notes, mark as watched, and where to watch.
- **Multiple lists:** the page title is a list switcher. Create, rename and delete lists.
- **Sharing:** share a list with anyone who has an account, as **Can edit** or **Can view**. You can change or remove access later, and people can leave lists shared with them. Watched status, ratings and notes are shared by everyone on the list. Viewers get a read-only view, enforced by the database.
- Light and dark themes. Your settings and last-opened list sync across devices through your account.

---

## One-time setup

### 1. Supabase (database and login)
1. Create a free project at https://supabase.com.
2. Go to **SQL Editor → New query**, paste in [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. It's safe to re-run, and it upgrades older versions of the schema in place (existing movies move into "My watchlist").
3. Allow sign-ups: **Authentication → Sign In / Providers → Email**, and turn on **Allow new users to sign up**.
   - Leave **Confirm email** on and new users get a confirmation link first. Turn it off and they're signed in straight away.
4. Tell Supabase where the site lives, so confirmation links come back to it: **Authentication → URL Configuration**
   - **Site URL:** `https://<your-username>.github.io/<repo-name>/`
   - **Redirect URLs:** add the Site URL and `http://localhost:5173/`
5. Copy **Project Settings → API → Project URL** and the **anon public** key (newer projects call it the **publishable** key).

Anyone can create an account, but row-level security means a new account only sees its own lists and lists shared with it.

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
  components/              Header, Toolbar, Lists (switcher), Dialogs (share/name/confirm),
                           Filters, Movies (grid/list/text), Detail drawer
```

Availability data is from JustWatch via TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
