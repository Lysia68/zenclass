-- Gel d'abonnement : permet de geler temporairement l'accès d'un membre
ALTER TABLE members ADD COLUMN IF NOT EXISTS frozen_until date DEFAULT NULL;

COMMENT ON COLUMN members.frozen_until IS 'Si non null et >= today, le membre ne peut pas réserver de séances';
