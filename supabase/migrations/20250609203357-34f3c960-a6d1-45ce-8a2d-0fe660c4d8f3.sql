
-- Créer une nouvelle table work_schedule_requests avec un schéma strict
-- Cette table remplacera l'ancienne pour éliminer tous les problèmes de données fantômes

-- Vérifier si la table existe déjà et la renommer si nécessaire
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_schedule_requests') THEN
        ALTER TABLE work_schedule_requests RENAME TO work_schedule_requests_old;
    END IF;
END $$;

-- Créer la nouvelle table avec des contraintes strictes
CREATE TABLE public.work_schedule_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type = 'telework'),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status = 'approved'),
  is_exceptional BOOLEAN NOT NULL DEFAULT false,
  reason TEXT DEFAULT 'Télétravail sélectionné',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte unique stricte pour éviter les doublons
  CONSTRAINT unique_user_telework_date UNIQUE (user_id, start_date, request_type)
);

-- Migrer uniquement les données valides et uniques de l'ancienne table si elle existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_schedule_requests_old') THEN
        INSERT INTO work_schedule_requests (user_id, request_type, start_date, end_date, status, reason, approved_by, approved_at, created_at, updated_at)
        SELECT DISTINCT ON (user_id, start_date)
            user_id,
            'telework',
            start_date::DATE,
            COALESCE(end_date::DATE, start_date::DATE),
            'approved',
            COALESCE(reason, 'Télétravail sélectionné'),
            approved_by,
            COALESCE(approved_at, created_at),
            created_at,
            updated_at
        FROM work_schedule_requests_old 
        WHERE user_id IS NOT NULL 
          AND start_date IS NOT NULL
          AND request_type = 'telework'
        ORDER BY user_id, start_date, created_at DESC;
    END IF;
END $$;

-- Activer RLS (Row Level Security)
ALTER TABLE public.work_schedule_requests ENABLE ROW LEVEL SECURITY;

-- Politiques RLS - Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own telework requests" 
  ON public.work_schedule_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own telework requests" 
  ON public.work_schedule_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND request_type = 'telework');

-- Les utilisateurs peuvent modifier leurs propres demandes
CREATE POLICY "Users can update their own telework requests" 
  ON public.work_schedule_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres demandes
CREATE POLICY "Users can delete their own telework requests" 
  ON public.work_schedule_requests 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can view all telework requests" 
  ON public.work_schedule_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all telework requests" 
  ON public.work_schedule_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_work_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_work_schedule_requests_updated_at
  BEFORE UPDATE ON work_schedule_requests
  FOR EACH ROW EXECUTE FUNCTION update_work_schedule_updated_at();
