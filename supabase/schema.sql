-- Salah Links database schema for Supabase / PostgreSQL
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{4,32}$'),
  destination_url text not null,
  title text,
  is_active boolean not null default true,
  expires_at timestamptz,
  click_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists links_user_created_idx on public.links(user_id, created_at desc);
create index if not exists links_code_idx on public.links(code);

create table if not exists public.clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  country text,
  device_type text check (device_type is null or device_type in ('desktop','mobile','tablet','unknown'))
);
create index if not exists clicks_link_time_idx on public.clicks(link_id, clicked_at desc);

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.clicks enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage own links" on public.links;
create policy "Users can manage own links" on public.links for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public visitors must not query tables directly. The redirect route uses a narrowly scoped SQL function.
create or replace function public.resolve_short_link(p_code text)
returns table(link_id uuid, destination_url text)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  update public.links l
     set click_count = l.click_count + 1, updated_at = l.updated_at
   where l.code = p_code and l.is_active = true and (l.expires_at is null or l.expires_at > now())
  returning l.id, l.destination_url;
end;
$$;
revoke all on function public.resolve_short_link(text) from public;
grant execute on function public.resolve_short_link(text) to anon, authenticated;

-- Click records are inserted through the server API using the user's session for owned links.
-- Keep direct browser access disabled by default; dashboard reads are performed through RLS-aware server clients.
drop policy if exists "Users can view clicks for own links" on public.clicks;
create policy "Users can view clicks for own links" on public.clicks for select to authenticated
using (exists (select 1 from public.links l where l.id = clicks.link_id and l.user_id = auth.uid()));
drop policy if exists "Users can insert clicks for own links" on public.clicks;
create policy "Users can insert clicks for own links" on public.clicks for insert to authenticated
with check (exists (select 1 from public.links l where l.id = clicks.link_id and l.user_id = auth.uid()));

-- Create profile automatically for new accounts.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name','')) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
