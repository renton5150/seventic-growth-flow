
-- Créer la table pour gérer les invitations utilisateur
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'growth', 'sdr')),
  invitation_token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  is_used BOOLEAN DEFAULT FALSE
);

-- Index pour optimiser les recherches par token
CREATE INDEX idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);

-- RLS pour sécuriser l'accès
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins et growth de voir toutes les invitations
CREATE POLICY "Admins and Growth can view all invitations" 
  ON public.user_invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'growth')
    )
  );

-- Politique pour permettre aux admins et growth de créer des invitations
CREATE POLICY "Admins and Growth can create invitations" 
  ON public.user_invitations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'growth')
    )
  );

-- Politique pour permettre à tout le monde de lire les invitations par token (pour validation)
CREATE POLICY "Anyone can read invitation by token" 
  ON public.user_invitations 
  FOR SELECT 
  USING (TRUE);

-- Politique pour permettre la mise à jour lors de l'utilisation du token
CREATE POLICY "Anyone can update invitation when using token" 
  ON public.user_invitations 
  FOR UPDATE 
  USING (TRUE);
