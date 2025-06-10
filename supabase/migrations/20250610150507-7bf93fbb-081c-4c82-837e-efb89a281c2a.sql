
-- Vérifier les politiques RLS existantes pour email_platform_accounts
DROP POLICY IF EXISTS "Users can view email platform accounts" ON public.email_platform_accounts;
DROP POLICY IF EXISTS "Users can create email platform accounts" ON public.email_platform_accounts;
DROP POLICY IF EXISTS "Users can update email platform accounts" ON public.email_platform_accounts;
DROP POLICY IF EXISTS "Users can delete email platform accounts" ON public.email_platform_accounts;

-- Créer des politiques RLS appropriées pour permettre aux utilisateurs growth et admin de gérer les comptes
CREATE POLICY "Growth and admin can view all email platform accounts"
ON public.email_platform_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can create email platform accounts"
ON public.email_platform_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can update email platform accounts"
ON public.email_platform_accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

CREATE POLICY "Growth and admin can delete email platform accounts"
ON public.email_platform_accounts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

-- Faire de même pour email_platform_account_front_offices
DROP POLICY IF EXISTS "Users can manage front office associations" ON public.email_platform_account_front_offices;

CREATE POLICY "Growth and admin can manage front office associations"
ON public.email_platform_account_front_offices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'growth')
  )
);

-- S'assurer que RLS est activé
ALTER TABLE public.email_platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_platform_account_front_offices ENABLE ROW LEVEL SECURITY;
