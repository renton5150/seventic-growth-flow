
-- Créer la table pour les demandes de télétravail/congés
CREATE TABLE public.work_schedule_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('telework', 'paid_leave', 'unpaid_leave')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_exceptional BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  admin_comment TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les notifications
CREATE TABLE public.work_schedule_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES work_schedule_requests(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.work_schedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedule_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour work_schedule_requests
-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own requests" 
  ON public.work_schedule_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own requests" 
  ON public.work_schedule_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres demandes en attente
CREATE POLICY "Users can update their own pending requests" 
  ON public.work_schedule_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Les utilisateurs peuvent supprimer leurs propres demandes en attente
CREATE POLICY "Users can delete their own pending requests" 
  ON public.work_schedule_requests 
  FOR DELETE 
  USING (auth.uid() = user_id AND status = 'pending');

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can view all requests" 
  ON public.work_schedule_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests" 
  ON public.work_schedule_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques RLS pour work_schedule_notifications
-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.work_schedule_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" 
  ON public.work_schedule_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_work_schedule_requests_updated_at
  BEFORE UPDATE ON work_schedule_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
