
-- Cette fonction sera utilisée pour préparer une demande à être supprimée
-- en supprimant toutes les références à cette demande
CREATE OR REPLACE FUNCTION public.prepare_request_for_deletion(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à NULL toutes les références potentielles
  -- Ici on pourrait ajouter d'autres tables qui référencent les demandes
  
  -- Exemple: Si d'autres tables référençaient requests
  -- UPDATE table_name SET request_id = NULL WHERE request_id = $1;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la préparation de la demande % pour suppression: %', request_id, SQLERRM;
    RETURN FALSE;
END;
$$;
