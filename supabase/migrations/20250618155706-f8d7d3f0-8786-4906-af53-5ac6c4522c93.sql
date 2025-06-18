
-- Ajouter les colonnes manquantes à la table missions pour sauvegarder tous les champs du formulaire
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS objectif_mensuel_rdv TEXT,
ADD COLUMN IF NOT EXISTS types_prestation JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS criteres_qualification TEXT,
ADD COLUMN IF NOT EXISTS interlocuteurs_cibles TEXT,
ADD COLUMN IF NOT EXISTS login_connexion TEXT;
