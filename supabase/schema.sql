-- Reel watchlist schema.
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run. Also upgrades the original single-list schema (your existing
-- items move into a list called "My watchlist").
--
-- Model
--   lists          a named watchlist, owned by one user
--   list_members   people a list is shared with, as 'editor' or 'viewer'
--   watchlist_items movies on a list; watched / rating / note are shared by everyone on it
--   user_settings  per-user region, services, theme, last opened list
--
-- Access is enforced by row-level security:
--   owner + members can read a list and its items; owner + editors can change items;
--   only the owner can rename/delete/share a list; anyone can leave a list shared with them.

-- ---------------------------------------------------------------- tables

create table if not exists public.lists (
  id         uuid        primary key default gen_random_uuid(),
  owner_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.list_members (
  list_id  uuid        not null references public.lists (id) on delete cascade,
  user_id  uuid        not null references auth.users (id) on delete cascade,
  role     text        not null check (role in ('editor', 'viewer')),
  added_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table if not exists public.watchlist_items (
  list_id  uuid        not null references public.lists (id) on delete cascade,
  tmdb_id  integer     not null,
  added_by uuid        default auth.uid() references auth.users (id) on delete set null,
  added_at timestamptz not null default now(),
  watched  boolean     not null default false,
  rating   smallint    not null default 0 check (rating between 0 and 5),
  note     text        not null default '' check (char_length(note) <= 5000),
  movie    jsonb       not null,
  primary key (list_id, tmdb_id)
);

create table if not exists public.user_settings (
  user_id     uuid      primary key default auth.uid() references auth.users (id) on delete cascade,
  region      text      not null default 'CA' check (region in ('CA', 'US', 'GB')),
  my_services integer[] not null default '{}',
  theme       text      not null default 'dark' check (theme in ('dark', 'light'))
);
alter table public.user_settings
  add column if not exists current_list uuid references public.lists (id) on delete set null;

-- ------------------------------------------- upgrade from the single-list schema

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'watchlist_items' and column_name = 'user_id'
  ) then
    drop policy if exists "own watchlist" on public.watchlist_items;

    -- One "My watchlist" per user who already has items.
    insert into public.lists (owner_id, name)
    select distinct w.user_id, 'My watchlist'
    from public.watchlist_items w
    where not exists (select 1 from public.lists l where l.owner_id = w.user_id);

    alter table public.watchlist_items add column if not exists list_id uuid references public.lists (id) on delete cascade;
    update public.watchlist_items w
       set list_id = (select l.id from public.lists l where l.owner_id = w.user_id order by l.created_at limit 1)
     where w.list_id is null;

    alter table public.watchlist_items drop constraint if exists watchlist_items_pkey;
    alter table public.watchlist_items drop constraint if exists watchlist_items_user_id_fkey;
    alter table public.watchlist_items alter column list_id set not null;
    alter table public.watchlist_items add primary key (list_id, tmdb_id);

    alter table public.watchlist_items rename column user_id to added_by;
    alter table public.watchlist_items alter column added_by drop not null;
    alter table public.watchlist_items
      add constraint watchlist_items_added_by_fkey foreign key (added_by) references auth.users (id) on delete set null;
  end if;
end $$;

create index if not exists lists_owner_idx on public.lists (owner_id);
create index if not exists list_members_user_idx on public.list_members (user_id);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so policies can check membership without recursing through RLS.

create or replace function public.is_list_member(lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lists where id = lid and owner_id = auth.uid())
      or exists (select 1 from public.list_members where list_id = lid and user_id = auth.uid());
$$;

create or replace function public.can_edit_list(lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lists where id = lid and owner_id = auth.uid())
      or exists (select 1 from public.list_members where list_id = lid and user_id = auth.uid() and role = 'editor');
$$;

create or replace function public.is_list_owner(lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lists where id = lid and owner_id = auth.uid());
$$;

-- Share a list with someone by email (or change their role). Owner only.
create or replace function public.share_list(lid uuid, member_email text, member_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
begin
  if not public.is_list_owner(lid) then
    raise exception 'Only the list owner can share it';
  end if;
  if member_role not in ('editor', 'viewer') then
    raise exception 'Role must be editor or viewer';
  end if;
  select id into target from auth.users where lower(email) = lower(btrim(member_email));
  if target is null then
    raise exception 'No Reel account uses that email yet — ask them to sign up first';
  end if;
  if target = auth.uid() then
    raise exception 'You already own this list';
  end if;
  insert into public.list_members (list_id, user_id, role)
  values (lid, target, member_role)
  on conflict (list_id, user_id) do update set role = excluded.role;
end $$;

-- Everyone with access to a list, with emails. Visible to anyone on the list.
create or replace function public.list_people(lid uuid)
returns table (user_id uuid, email text, role text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_list_member(lid) then
    raise exception 'Not allowed';
  end if;
  return query
    select p.uid, p.mail, p.r
      from (
        select l.owner_id as uid, u.email::text as mail, 'owner'::text as r, 0 as rank
          from public.lists l join auth.users u on u.id = l.owner_id
         where l.id = lid
        union all
        select m.user_id, u.email::text, m.role, case m.role when 'editor' then 1 else 2 end
          from public.list_members m join auth.users u on u.id = m.user_id
         where m.list_id = lid
      ) p
     order by p.rank, p.mail;
end $$;

revoke all on function public.is_list_member(uuid), public.can_edit_list(uuid), public.is_list_owner(uuid),
  public.share_list(uuid, text, text), public.list_people(uuid) from public, anon;
grant execute on function public.is_list_member(uuid), public.can_edit_list(uuid), public.is_list_owner(uuid),
  public.share_list(uuid, text, text), public.list_people(uuid) to authenticated;

-- ---------------------------------------------------------------- row-level security

alter table public.lists           enable row level security;
alter table public.list_members    enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.user_settings   enable row level security;

-- lists
drop policy if exists "lists: read"   on public.lists;
drop policy if exists "lists: create" on public.lists;
drop policy if exists "lists: update" on public.lists;
drop policy if exists "lists: delete" on public.lists;
create policy "lists: read"   on public.lists for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_list_member(id));
create policy "lists: create" on public.lists for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "lists: update" on public.lists for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "lists: delete" on public.lists for delete to authenticated using (owner_id = (select auth.uid()));

-- list_members (adding / role changes go through share_list())
drop policy if exists "members: read"   on public.list_members;
drop policy if exists "members: remove" on public.list_members;
create policy "members: read"   on public.list_members for select to authenticated using (public.is_list_member(list_id));
create policy "members: remove" on public.list_members for delete to authenticated
  using (public.is_list_owner(list_id) or user_id = (select auth.uid()));

-- watchlist_items
drop policy if exists "items: read"  on public.watchlist_items;
drop policy if exists "items: write" on public.watchlist_items;
drop policy if exists "items: edit"  on public.watchlist_items;
drop policy if exists "items: delete" on public.watchlist_items;
create policy "items: read"   on public.watchlist_items for select to authenticated using (public.is_list_member(list_id));
create policy "items: write"  on public.watchlist_items for insert to authenticated with check (public.can_edit_list(list_id));
create policy "items: edit"   on public.watchlist_items for update to authenticated
  using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));
create policy "items: delete" on public.watchlist_items for delete to authenticated using (public.can_edit_list(list_id));

-- user_settings
drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
