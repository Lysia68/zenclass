-- Correction du backfill Import initial
-- 60 membres avec crédits à l'import

BEGIN;

-- Supprimer les entrées incorrectes
DELETE FROM member_activity WHERE action = 'credit_add' AND details->>'source' = 'import_csv';

-- Réinsérer avec les vraies valeurs du CSV
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 20, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'laetitia.fimbel@outlook.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 20, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'delphine.ruant@laposte.net';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 16, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'luce.hubeaux68@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 16, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'isabelriotte65@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 14, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'patricia.ancel92@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 14, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marj.lalloue@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 14, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'cathlouf@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 12, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'myriam.leclerc@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 12, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sophieplassat@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 11, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'karen8273@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 9, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'alschmeder@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 9, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'isabelletrompeter@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 7, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'mpdavid2010@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 7, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathalie.valentin@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 6, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'bjehel@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 6, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'caroline.sanchez@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 6, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'pauline.sanchez@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 6, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'gilbert.vonarx@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 5, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'claudia30@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 5, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'herve.faltot@calixo.net';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 5, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'c.meyer@alsace.eu';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 5, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'domolle@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 5, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'genevieve@werck.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'belbezier.jean-marc@neuf.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'claudiachatelus@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'melanie.fuchot@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'bertrand.hussmann@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sylviajost@msn.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'melanie.luthringer@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sandrine.reichenshammer@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 4, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'avbl1011@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 3, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'ecker.franck@9business.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 3, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sandrine.jante@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 3, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sophie.schahl@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 3, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'vonthron.francine@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 3, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'corinne.k@club.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'ror-rore@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marj.chenal@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'martine.deroussent@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'support@of360.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'corinne.loberger@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'naudrey_g@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 2, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'megbracoxx@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sylvieduchene@yahoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'brun.carole@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'agclermont@hotmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'florence.collard@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'a.driesbach@wanadoo.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathaliegocel@free.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'margot.husser95@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marjolaine.jeanguenin@laposte.net';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'reginejenny@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'hervekohler68@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathipkrauth@orange.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'musserdelphine@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'jmichelneff@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'rachel.pigeon68@gmail.com';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'm3lii-ne.w@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'laurenceheiss@hotmail.fr';
INSERT INTO member_activity (studio_id, member_id, actor_role, action, details, created_at)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', id, 'system', 'credit_add',
  jsonb_build_object('amount', 1, 'source', 'import_csv', 'label', 'Import initial', 'backfilled', true),
  '2026-03-26 00:00:00'::timestamptz
FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'aurelie80@neuf.fr';

COMMIT;
