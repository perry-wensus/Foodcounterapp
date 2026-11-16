-- Initieel datamodel voedingsapp (Starter).
-- Principe: dataminimalisatie. Alleen wat nodig is; geen gewicht/lengte tot de regelmotor ze nodig heeft.
-- Row Level Security: elke gebruiker ziet en wijzigt alleen eigen rijen.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Expliciete toestemming (AVG art. 9): tijdstip + versie van de privacytekst.
  consent_at timestamptz,
  consent_version text,
  -- Onboarding (stap 6). Leeg tot de gebruiker onboarding doorloopt.
  onboarding jsonb,
  -- Uitkomst screening eetproblemen. true = geen compensatiefunctie.
  compensation_disabled boolean not null default false,
  -- Weekdoel, berekend door regelmotor uit onboarding (intern, nooit getoond in Starter).
  weekly_target jsonb,
  level text not null default 'starter' check (level in ('starter', 'gevorderd', 'expert'))
);

-- Profiel automatisch aanmaken bij registratie.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- scans: voorraadscan-sessies
-- ---------------------------------------------------------------------------
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'uploading'
    check (status in ('uploading', 'analyzing', 'analyzed', 'confirmed', 'failed')),
  -- Paden in storage-bucket 'scan-photos'. Wordt leeggemaakt zodra foto's na analyse zijn verwijderd.
  photo_paths text[] not null default '{}',
  photos_deleted_at timestamptz,
  detected jsonb,        -- ruwe AI-uitvoer (lijst DetectedIngredient)
  items jsonb,           -- door gebruiker bevestigde lijst (PantryItem[])
  corrections jsonb,     -- {added, removed, changed}
  error text
);
create index scans_user_created on public.scans (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  scan_id uuid references public.scans (id) on delete set null,
  style text not null check (style in ('quick', 'elaborate', 'easy', 'healthy', 'tasty')),
  data jsonb not null,           -- titel, tijd, porties, ingrediënten, stappen
  est_per_portion jsonb          -- geschatte kcal/macro's per portie: intern, niet getoond in Starter
);
create index recipes_user_created on public.recipes (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- meal_plan
-- ---------------------------------------------------------------------------
create table public.meal_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid references public.recipes (id) on delete set null,
  -- Bijsturing door regelmotor (bv. 'lighter'); geen getallen richting gebruiker.
  adjustment jsonb,
  unique (user_id, date, meal)
);

-- ---------------------------------------------------------------------------
-- meal_log
-- ---------------------------------------------------------------------------
create table public.meal_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'drink')),
  source text not null check (source in ('photo', 'tap', 'plan')),
  size text check (size in ('small', 'normal', 'large')),  -- alleen bij 'tap'
  meal_plan_id uuid references public.meal_plan (id) on delete set null,
  est_values jsonb,     -- geschatte waarden (schatting!)
  deviation jsonb       -- afwijking t.o.v. plan, berekend door regelmotor
);
create index meal_log_user_date on public.meal_log (user_id, date);

-- ---------------------------------------------------------------------------
-- shopping_items
-- ---------------------------------------------------------------------------
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  category text,
  source text not null default 'manual' check (source in ('advice', 'recipe', 'plan', 'manual')),
  recipe_id uuid references public.recipes (id) on delete set null,
  checked boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.recipes enable row level security;
alter table public.meal_plan enable row level security;
alter table public.meal_log enable row level security;
alter table public.shopping_items enable row level security;

create policy "own profile select" on public.profiles for select using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['scans', 'recipes', 'meal_plan', 'meal_log', 'shopping_items'] loop
    execute format('create policy "own rows select" on public.%I for select using ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: privé bucket voor scanfoto's. Pad: <user_id>/<scan_id>/<n>.jpg
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scan-photos', 'scan-photos', false, 5242880, array['image/jpeg']);

create policy "own photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own photos select" on storage.objects for select to authenticated
  using (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'scan-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
