
-- Créer la table des domaines
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name TEXT NOT NULL,
  mission_id UUID REFERENCES public.missions(id),
  hosting_provider TEXT CHECK (hosting_provider IN ('OVH', 'Gandhi', 'Ionos')),
  login TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  creation_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Suspendu')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer un index sur le nom de domaine pour des recherches rapides
CREATE INDEX idx_domains_domain_name ON public.domains(domain_name);

-- Créer un index sur la mission pour filtrer par mission
CREATE INDEX idx_domains_mission_id ON public.domains(mission_id);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter les politiques RLS (Row Level Security)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Users can view domains" 
  ON public.domains 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Permettre la création/modification/suppression pour les admins et growth
CREATE POLICY "Admins and growth can manage domains" 
  ON public.domains 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'growth')
    )
  );
