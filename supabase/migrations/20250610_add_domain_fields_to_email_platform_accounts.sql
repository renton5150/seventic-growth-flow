
-- Ajouter les champs de domaine à la table email_platform_accounts
ALTER TABLE email_platform_accounts 
ADD COLUMN IF NOT EXISTS domain_name text,
ADD COLUMN IF NOT EXISTS domain_hosting_provider text CHECK (domain_hosting_provider IN ('OVH', 'Gandhi', 'Ionos')),
ADD COLUMN IF NOT EXISTS domain_login text,
ADD COLUMN IF NOT EXISTS domain_password text;

-- Ajouter des commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN email_platform_accounts.domain_name IS 'Nom de domaine associé au compte';
COMMENT ON COLUMN email_platform_accounts.domain_hosting_provider IS 'Fournisseur d\'hébergement du domaine (OVH, Gandhi, Ionos)';
COMMENT ON COLUMN email_platform_accounts.domain_login IS 'Login pour l\'hébergeur du domaine';
COMMENT ON COLUMN email_platform_accounts.domain_password IS 'Mot de passe pour l\'hébergeur du domaine (stocké en clair)';
