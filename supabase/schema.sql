-- ============================================================
-- ZENCLASS — Supabase Schema
-- Copiez-collez ce fichier dans Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── STUDIOS (multi-tenant) ────────────────────────────────
create table studios (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  address     text,
  phone       text,
  email       text,
  plan        text default 'starter' check (plan in ('starter','pro','business')),
  created_at  timestamptz default now()
);

-- ── PROFILES (studio owners / staff) ─────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  studio_id   uuid references studios(id) on delete cascade,
  first_name  text,
  last_name   text,
  role        text default 'admin' check (role in ('admin','staff')),
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── DISCIPLINES ───────────────────────────────────────────
create table disciplines (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid references studios(id) on delete cascade not null,
  name        text not null,
  icon        text default '🧘',
  color       text default '#B8936A',
  created_at  timestamptz default now()
);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────
create table subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid references studios(id) on delete cascade not null,
  name        text not null,
  price       numeric(10,2) not null,
  period      text not null check (period in ('mois','séance','carnet','trimestre','année')),
  description text,
  popular     boolean default false,
  color       text default '#B8936A',
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── MEMBERS ───────────────────────────────────────────────
create table members (
  id              uuid primary key default uuid_generate_v4(),
  studio_id       uuid references studios(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text,
  status          text default 'actif' check (status in ('actif','suspendu','nouveau')),
  credits         integer default 0,
  joined_at       date default current_date,
  next_payment    date,
  notes           text,
  created_at      timestamptz default now(),
  unique(studio_id, email)
);

-- ── SESSIONS ──────────────────────────────────────────────
create table sessions (
  id              uuid primary key default uuid_generate_v4(),
  studio_id       uuid references studios(id) on delete cascade not null,
  discipline_id   uuid references disciplines(id) on delete set null,
  teacher         text not null,
  room            text,
  level           text default 'Tous niveaux',
  session_date    date not null,
  session_time    time not null,
  duration_min    integer default 60,
  spots           integer default 12,
  status          text default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  created_at      timestamptz default now()
);

-- ── BOOKINGS ─────────────────────────────────────────────
create table bookings (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid references sessions(id) on delete cascade not null,
  member_id   uuid references members(id) on delete cascade not null,
  status      text default 'confirmed' check (status in ('confirmed','waitlist','cancelled')),
  created_at  timestamptz default now(),
  unique(session_id, member_id)
);

-- ── PAYMENTS ─────────────────────────────────────────────
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  studio_id       uuid references studios(id) on delete cascade not null,
  member_id       uuid references members(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount          numeric(10,2) not null,
  payment_date    date default current_date,
  payment_type    text check (payment_type in ('Prélèvement','Carte','Espèces','Virement')),
  status          text default 'payé' check (status in ('payé','impayé','remboursé')),
  notes           text,
  created_at      timestamptz default now()
);

-- ── VIEWS (KPIs) ──────────────────────────────────────────
create or replace view studio_kpis as
select
  s.id as studio_id,
  s.name as studio_name,
  count(distinct m.id) filter (where m.status = 'actif') as active_members,
  count(distinct se.id) filter (where date_trunc('month', se.session_date) = date_trunc('month', current_date)) as sessions_this_month,
  coalesce(sum(p.amount) filter (where p.status = 'payé' and date_trunc('month', p.payment_date) = date_trunc('month', current_date)), 0) as revenue_this_month,
  coalesce(sum(p.amount) filter (where p.status = 'impayé'), 0) as unpaid_amount
from studios s
left join members m on m.studio_id = s.id
left join sessions se on se.studio_id = s.id
left join payments p on p.studio_id = s.id
group by s.id, s.name;

-- Fill rate view
create or replace view session_fill_rates as
select
  se.id,
  se.studio_id,
  se.session_date,
  se.session_time,
  se.spots,
  count(b.id) filter (where b.status = 'confirmed') as booked,
  count(b.id) filter (where b.status = 'waitlist') as waitlist,
  case when se.spots > 0
    then round(count(b.id) filter (where b.status = 'confirmed')::numeric / se.spots * 100, 1)
    else 0 end as fill_rate_pct
from sessions se
left join bookings b on b.session_id = se.id
group by se.id;

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table studios       enable row level security;
alter table profiles      enable row level security;
alter table disciplines   enable row level security;
alter table subscriptions enable row level security;
alter table members       enable row level security;
alter table sessions      enable row level security;
alter table bookings      enable row level security;
alter table payments      enable row level security;

-- Profiles: users see their own
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Studios: only members of the studio
create policy "studios_own" on studios for all
  using (id = (select studio_id from profiles where id = auth.uid()));

-- All studio tables: scoped to studio
create policy "disciplines_studio" on disciplines for all
  using (studio_id = (select studio_id from profiles where id = auth.uid()));
create policy "subscriptions_studio" on subscriptions for all
  using (studio_id = (select studio_id from profiles where id = auth.uid()));
create policy "members_studio" on members for all
  using (studio_id = (select studio_id from profiles where id = auth.uid()));
create policy "sessions_studio" on sessions for all
  using (studio_id = (select studio_id from profiles where id = auth.uid()));
create policy "payments_studio" on payments for all
  using (studio_id = (select studio_id from profiles where id = auth.uid()));
create policy "bookings_studio" on bookings for all
  using (session_id in (select id from sessions where studio_id = (select studio_id from profiles where id = auth.uid())));

-- ── SEED DATA (demo studio) ───────────────────────────────
-- Uncomment and run after creating your first user via Supabase Auth
/*
insert into studios (id, name, slug, address, email, plan)
values ('00000000-0000-0000-0000-000000000001', 'Yogalate Paris', 'yogalate-paris', '12 rue de la Paix, 75001 Paris', 'contact@yogalate.fr', 'pro');

update profiles set studio_id = '00000000-0000-0000-0000-000000000001', first_name = 'Marie', last_name = 'Laurent'
where id = auth.uid();
*/
