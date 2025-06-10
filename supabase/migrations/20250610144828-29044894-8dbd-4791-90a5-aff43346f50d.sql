
-- Migration corrigée pour ajouter les champs de domaine
ALTER TABLE email_platform_accounts 
ADD COLUMN IF NOT EXISTS domain_name text,
ADD COLUMN IF NOT EXISTS domain_hosting_provider text,
ADD COLUMN IF NOT EXISTS domain_login text,
ADD COLUMN IF NOT EXISTS domain_password text;

-- Ajouter la contrainte après la création de la colonne
ALTER TABLE email_platform_accounts 
ADD CONSTRAINT check_domain_hosting_provider 
CHECK (domain_hosting_provider IS NULL OR domain_hosting_provider IN ('OVH', 'Gandhi', 'Ionos'));
