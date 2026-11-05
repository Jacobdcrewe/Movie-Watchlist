-- Reel watchlist schema. Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Row-level security means every row belongs to a user and only that user can read/write it.

create table if not exists public.watchlist_items (
  user_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  tmdb_id   integer     not null,
  added_at  timestamptz not null default now(),
  watched   boolean     not null default false,
  rating    smallint    not null default 0 check (rating between 0 and 5),
  note      text        not null default '' check (char_length(note) <= 5000),
  movie     jsonb       not null,
  primary key (user_id, tmdb_id)
);

create table if not exists public.user_settings (
  user_id     uuid      primary key default auth.uid() references auth.users (id) on delete cascade,
  region      text      not null default 'CA' check (region in ('CA', 'US', 'GB')),
  my_services integer[] not null default '{}',
  theme       text      not null default 'dark' check (theme in ('dark', 'light'))
);

alter table public.watchlist_items enable row level security;
alter table public.user_settings  enable row level security;

drop policy if exists "own watchlist" on public.watchlist_items;
create policy "own watchlist" on public.watchlist_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
