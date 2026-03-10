-- ══════════════════════════════════════════════════════════════════════
-- STRIPE BILLING — migration à exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════

-- 1. Table des formules d'abonnement
-- ─────────────────────────────────────────────────────────────────────
create table if not exists plans (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,          -- 'Essentiel' | 'Standard' | 'Pro'
  slug                text not null unique,   -- 'essentiel' | 'standard' | 'pro'
  price_monthly       int  not null,          -- en centimes : 900 | 2900 | 6900
  stripe_price_id     text,                   -- price_xxx de Stripe (à renseigner après création)
  features            jsonb default '[]',
  max_members         int default 50,
  max_coaches         int default 2,
  active              boolean default true,
  created_at          timestamptz default now()
);

-- Seed des 3 plans
insert into plans (name, slug, price_monthly, max_members, max_coaches, features) values
  ('Essentiel', 'essentiel', 900,   50,  2,  '["Planning","Adhérents","Paiements"]'),
  ('Standard',  'standard',  2900,  200, 5,  '["Planning","Adhérents","Paiements","Disciplines","Statistiques"]'),
  ('Pro',       'pro',       6900,  null,null,'["Planning","Adhérents","Paiements","Disciplines","Statistiques","API","Support prioritaire"]')
on conflict (slug) do nothing;

-- 2. Colonnes billing sur studios
-- ─────────────────────────────────────────────────────────────────────
alter table studios
  add column if not exists trial_ends_at          timestamptz default (now() + interval '15 days'),
  add column if not exists billing_status         text        default 'trialing'
    check (billing_status in ('trialing','active','past_due','canceled','suspended')),
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan_slug              text        references plans(slug) default 'essentiel',
  add column if not exists plan_started_at        timestamptz;

-- Index pour les lookups Stripe webhook
create index if not exists studios_stripe_customer_idx    on studios(stripe_customer_id);
create index if not exists studios_stripe_sub_idx         on studios(stripe_subscription_id);
create index if not exists studios_billing_status_idx     on studios(billing_status);

-- 3. Vue utilitaire billing (optionnelle, pratique pour le dashboard SA)
-- ─────────────────────────────────────────────────────────────────────
create or replace view studios_billing as
select
  s.id,
  s.name,
  s.slug,
  s.billing_status,
  s.trial_ends_at,
  s.plan_slug,
  p.name          as plan_name,
  p.price_monthly as plan_price,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  greatest(0, extract(epoch from (s.trial_ends_at - now())) / 86400)::int as trial_days_left
from studios s
left join plans p on p.slug = s.plan_slug;

-- 4. Fonction helper pour vérifier l'accès billing
-- ─────────────────────────────────────────────────────────────────────
create or replace function studio_billing_ok(p_studio_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from studios
    where id = p_studio_id
      and billing_status in ('trialing', 'active')
      and (billing_status != 'trialing' or trial_ends_at > now())
  );
$$;
