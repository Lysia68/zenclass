-- ============================================================
-- SAMAVI — Supabase Schema v4
-- 3 vues : Super Admin / Studio (admin+staff) / Adhérent
-- Copiez-collez dans Supabase SQL Editor → Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════════════════════════
-- STUDIOS (multi-tenant)
-- ══════════════════════════════════════════════════════════════
create table studios (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  address       text,
  city          text,
  phone         text,
  email         text,
  plan          text default 'starter' check (plan in ('starter','pro','business')),
  status        text default 'actif' check (status in ('actif','suspendu')),
  suspended_at  timestamptz,
  created_at    timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- PROFILES — admins et staff du studio
-- ══════════════════════════════════════════════════════════════
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  studio_id   uuid references studios(id) on delete cascade,
  first_name  text,
  last_name   text,
  role        text default 'admin' check (role in ('superadmin','admin','staff')),
  created_at  timestamptz default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, first_name, last_name)
  values (new.id,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- DISCIPLINES
-- ══════════════════════════════════════════════════════════════
create table disciplines (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid references studios(id) on delete cascade not null,
  name        text not null,
  icon        text default '🧘',
  color       text default '#B8936A',
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- MEMBERS — adhérents du studio
-- ══════════════════════════════════════════════════════════════
create table members (
  id              uuid primary key default uuid_generate_v4(),
  studio_id       uuid references studios(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  auth_user_id    uuid references auth.users on delete set null,
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text,
  status          text default 'actif' check (status in ('actif','suspendu','nouveau')),
  credits         integer default 0,
  credits_total   integer default 0,
  joined_at       date default current_date,
  next_payment    date,
  notes           text,
  created_at      timestamptz default now(),
  unique(studio_id, email)
);

-- ══════════════════════════════════════════════════════════════
-- SESSIONS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- BOOKINGS
-- ══════════════════════════════════════════════════════════════
create table bookings (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid references sessions(id) on delete cascade not null,
  member_id   uuid references members(id) on delete cascade not null,
  status      text default 'confirmed' check (status in ('confirmed','waitlist','cancelled')),
  created_at  timestamptz default now(),
  unique(session_id, member_id)
);

-- ══════════════════════════════════════════════════════════════
-- PAYMENTS
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- SUPPORT TICKETS (compteur Super Admin)
-- ══════════════════════════════════════════════════════════════
create table support_tickets (
  id          uuid primary key default uuid_generate_v4(),
  studio_id   uuid references studios(id) on delete cascade,
  subject     text not null,
  message     text,
  status      text default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority    text default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at  timestamptz default now(),
  resolved_at timestamptz
);

-- ══════════════════════════════════════════════════════════════
-- VIEWS
-- ══════════════════════════════════════════════════════════════

create or replace view studio_kpis as
select
  s.id                  as studio_id,
  s.name                as studio_name,
  s.plan,
  s.status              as studio_status,
  s.city,
  count(distinct m.id) filter (where m.status = 'actif') as active_members,
  count(distinct se.id) filter (where date_trunc('month', se.session_date) = date_trunc('month', current_date)) as sessions_this_month,
  coalesce(sum(p.amount) filter (where p.status = 'payé' and date_trunc('month', p.payment_date) = date_trunc('month', current_date)), 0) as revenue_this_month,
  coalesce(sum(p.amount) filter (where p.status = 'impayé'), 0) as unpaid_amount
from studios s
left join members m    on m.studio_id = s.id
left join sessions se  on se.studio_id = s.id
left join payments p   on p.studio_id = s.id
group by s.id, s.name, s.plan, s.status, s.city;

create or replace view session_fill_rates as
select
  se.id,
  se.studio_id,
  se.session_date,
  se.session_time,
  se.spots,
  count(b.id) filter (where b.status = 'confirmed') as booked,
  count(b.id) filter (where b.status = 'waitlist')  as waitlist,
  case when se.spots > 0
    then round(count(b.id) filter (where b.status = 'confirmed')::numeric / se.spots * 100, 1)
    else 0 end as fill_rate_pct
from sessions se
left join bookings b on b.session_id = se.id
group by se.id;

create or replace view member_session_history as
select
  b.member_id,
  b.status                        as booking_status,
  se.session_date,
  se.session_time,
  se.duration_min,
  se.teacher,
  d.name                          as discipline_name,
  d.color                         as discipline_color,
  d.icon                          as discipline_icon,
  case when se.session_date < current_date and b.status = 'confirmed' then 'présent'
       when se.session_date < current_date and b.status = 'cancelled'  then 'absent'
       else 'à venir' end         as attendance_status
from bookings b
join sessions se       on se.id = b.session_id
left join disciplines d on d.id = se.discipline_id
where b.status in ('confirmed','cancelled');

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════
alter table studios          enable row level security;
alter table profiles         enable row level security;
alter table disciplines      enable row level security;
alter table subscriptions    enable row level security;
alter table members          enable row level security;
alter table sessions         enable row level security;
alter table bookings         enable row level security;
alter table payments         enable row level security;
alter table support_tickets  enable row level security;

create or replace function my_studio_id()
returns uuid language sql stable security definer as $$
  select studio_id from profiles where id = auth.uid()
$$;

create or replace function my_role()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function my_member_id()
returns uuid language sql stable security definer as $$
  select id from members where auth_user_id = auth.uid() limit 1
$$;

-- Profiles
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Studios
create policy "studios_superadmin" on studios for all
  using (my_role() = 'superadmin');
create policy "studios_own" on studios for all
  using (id = my_studio_id() and my_role() in ('admin','staff'));

-- Tables du studio
create policy "disciplines_studio"   on disciplines   for all using (studio_id = my_studio_id());
create policy "subscriptions_studio" on subscriptions for all using (studio_id = my_studio_id());
create policy "sessions_studio"      on sessions      for all using (studio_id = my_studio_id());
create policy "payments_studio"      on payments      for all using (studio_id = my_studio_id());

-- Members : admin voit tous / adhérent voit lui-même
create policy "members_studio_admin" on members for all
  using (studio_id = my_studio_id() and my_role() in ('admin','staff','superadmin'));
create policy "members_self" on members for select
  using (auth_user_id = auth.uid());

-- Bookings : admin voit tout / adhérent voit les siennes
create policy "bookings_studio_admin" on bookings for all
  using (session_id in (select id from sessions where studio_id = my_studio_id())
         and my_role() in ('admin','staff','superadmin'));
create policy "bookings_self" on bookings for all
  using (member_id = my_member_id());

-- Support tickets
create policy "tickets_superadmin" on support_tickets for all using (my_role() = 'superadmin');
create policy "tickets_studio"     on support_tickets for all using (studio_id = my_studio_id());

-- ══════════════════════════════════════════════════════════════
-- SEED DATA (démo) — décommenter après création du premier compte
-- ══════════════════════════════════════════════════════════════
/*
insert into studios (id, name, slug, city, address, email, plan) values
  ('00000000-0000-0000-0000-000000000001', 'Samavi Paris',   'samavi-paris',   'Paris 1er',   '12 rue de la Paix, 75001 Paris',   'contact@samavi.fr',   'pro'),
  ('00000000-0000-0000-0000-000000000002', 'Samavi Lyon',  'samavi-lyon',  'Lyon 2e',     '5 place Bellecour, 69002 Lyon',     'hello@samavi-lyon.fr',    'starter'),
  ('00000000-0000-0000-0000-000000000003', 'Samavi Bordeaux',    'samavi-bordeaux',    'Bordeaux',    '8 cours Victor Hugo, 33000 Bordeaux','info@samavi-bordeaux.fr',  'pro');

-- Rattacher l'admin au studio (remplacer YOUR_USER_ID)
update profiles
set studio_id  = '00000000-0000-0000-0000-000000000001',
    first_name = 'Marie', last_name = 'Laurent', role = 'admin'
where id = 'YOUR_USER_ID';

-- Super admin (remplacer SUPERADMIN_USER_ID)
update profiles set role = 'superadmin' where id = 'SUPERADMIN_USER_ID';

-- Disciplines
insert into disciplines (studio_id, name, icon, color) values
  ('00000000-0000-0000-0000-000000000001', 'Yoga Vinyasa', '🧘', '#C4956A'),
  ('00000000-0000-0000-0000-000000000001', 'Pilates',      '⚡', '#6B9E7A'),
  ('00000000-0000-0000-0000-000000000001', 'Méditation',   '☯',  '#6A8FAE'),
  ('00000000-0000-0000-0000-000000000001', 'Yin Yoga',     '🌙', '#AE7A7A');

-- Abonnements
insert into subscriptions (studio_id, name, price, period, description, popular, color) values
  ('00000000-0000-0000-0000-000000000001', 'Mensuel illimité',  89,  'mois',      'Accès illimité à toutes les séances', true,  '#C4956A'),
  ('00000000-0000-0000-0000-000000000001', 'Carnet 10 séances', 120, 'carnet',    'Valable 6 mois, toutes disciplines',  false, '#6B9E7A'),
  ('00000000-0000-0000-0000-000000000001', 'Séance découverte', 20,  'séance',    'Première venue pour les nouveaux',    false, '#6A8FAE'),
  ('00000000-0000-0000-0000-000000000001', 'Trimestriel',       240, 'trimestre', '3 mois d''accès illimité',             false, '#AE7A7A');
*/
