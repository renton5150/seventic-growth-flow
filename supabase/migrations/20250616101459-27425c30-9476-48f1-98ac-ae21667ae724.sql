
-- Vérifier et supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view email platforms" ON public.email_platforms;
DROP POLICY IF EXISTS "Users can create email platforms" ON public.email_platforms;
DROP POLICY IF EXISTS "Users can update email platforms" ON public.email_platforms;
DROP POLICY IF EXISTS "Users can delete email platforms" ON public.email_platforms;

-- Créer des politiques RLS pour permettre aux utilisateurs growth et admin de gérer les plateformes
CREATE POLICY "Growth and admin can view all email platforms"
ON public.email_platforms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can create email platforms"
ON public.email_platforms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can update email platforms"
ON public.email_platforms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can delete email platforms"
ON public.email_platforms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

-- S'assurer que RLS est activé
ALTER TABLE public.email_platforms ENABLE ROW LEVEL SECURITY;
