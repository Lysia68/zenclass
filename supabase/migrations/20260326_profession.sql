-- Champ profession optionnel pour les membres
ALTER TABLE members ADD COLUMN IF NOT EXISTS profession text DEFAULT NULL;
