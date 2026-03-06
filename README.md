# ZenClass — Studio Manager

Application de gestion de studio yoga/bien-être. Stack : Next.js 15 + Supabase + Vercel.

## Démarrage rapide

### 1. Supabase
1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** → copiez-collez le contenu de `supabase/schema.sql`
3. Exécutez le script
4. Notez votre `Project URL` et `anon public key` (Settings → API)

### 2. Installation locale
```bash
npm install
cp .env.example .env.local
# Éditez .env.local avec vos clés Supabase
npm run dev
```

### 3. Premier compte
1. Ouvrez http://localhost:3000
2. Créez un compte (email + mot de passe)
3. Dans Supabase SQL Editor, exécutez :
```sql
-- Créez votre studio (remplacez l'email)
insert into studios (id, name, slug, email, plan)
values ('00000000-0000-0000-0000-000000000001', 'Mon Studio', 'mon-studio', 'contact@monstudio.fr', 'pro');

-- Liez votre profil au studio
update profiles 
set studio_id = '00000000-0000-0000-0000-000000000001', first_name = 'Marie', last_name = 'Laurent'
where id = (select id from auth.users where email = 'VOTRE_EMAIL');
```

### 4. Déploiement Vercel
```bash
npx vercel --prod
```
Ajoutez les variables d'environnement dans le dashboard Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Structure du projet
```
src/
  app/
    page.tsx          # Login
    dashboard/        # Tableau de bord (données live)
    members/          # Adhérents (CRUD complet)
    planning/         # Planning des séances
    payments/         # Paiements
    subscriptions/    # Abonnements
    disciplines/      # Disciplines
    settings/         # Paramètres studio
  lib/
    supabase.ts       # Client browser
    supabase-server.ts# Client serveur
    types.ts          # TypeScript types
  middleware.ts       # Auth protection
supabase/
  schema.sql          # Schéma complet + RLS
```

## Fonctionnalités implémentées
- ✅ Auth (login / signup) via Supabase Auth
- ✅ Protection des routes (middleware)
- ✅ Dashboard avec KPIs live depuis Supabase
- ✅ Adhérents — liste, recherche, ajout, suspend, suppression
- ✅ Paiements — liste, marquer comme payé
- ✅ Multi-tenant (RLS par studio_id)
- 🔜 Planning + réservations
- 🔜 Abonnements CRUD
- 🔜 Disciplines CRUD
- 🔜 Paramètres studio
