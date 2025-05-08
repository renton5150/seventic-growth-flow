
-- Correction pour la fonction update_acelle_campaign_stats qui essaie de supprimer d'une vue
CREATE OR REPLACE FUNCTION public.update_acelle_campaign_stats(account_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  log_entry_id UUID;
BEGIN
  -- Créer une entrée de log pour cette opération
  INSERT INTO acelle_sync_logs (
    operation,
    account_id,
    details
  ) VALUES (
    'update_acelle_campaign_stats',
    account_id_param,
    jsonb_build_object('started_at', now())
  ) RETURNING id INTO log_entry_id;
  
  -- Au lieu de supprimer de la vue, nous allons utiliser une approche de remplacement
  -- en utilisant INSERT ON CONFLICT DO UPDATE
  WITH stats AS (
    SELECT 
      account_id,
      COUNT(*) as campaign_count,
      SUM(COALESCE((delivery_info->>'subscriber_count')::numeric, 0)) as total_emails,
      SUM(COALESCE((delivery_info->>'delivered_count')::numeric, 0)) as total_delivered,
      SUM(COALESCE((delivery_info->>'open_count')::numeric, 0)) as total_opened,
      SUM(COALESCE((delivery_info->>'click_count')::numeric, 0)) as total_clicked,
      SUM(COALESCE((delivery_info->>'bounce_count')::numeric, 
          COALESCE((delivery_info->'bounced'->>'total')::numeric, 0))) as total_bounced,
      AVG(COALESCE((delivery_info->>'uniq_open_rate')::numeric, 0)) as avg_open_rate,
      AVG(COALESCE((delivery_info->>'click_rate')::numeric, 0)) as avg_click_rate
    FROM 
      email_campaigns_cache
    WHERE 
      account_id = account_id_param
    GROUP BY 
      account_id
  )
  -- Utiliser une CTE temporaire pour capturer le résultat
  , inserted_stats AS (
    INSERT INTO email_campaigns_stats (
      account_id, 
      campaign_count,
      total_emails,
      total_opened,
      total_clicked,
      total_bounced,
      avg_open_rate,
      avg_click_rate
    )
    SELECT 
      account_id,
      campaign_count,
      total_emails,
      total_opened,
      total_clicked,
      total_bounced,
      avg_open_rate,
      avg_click_rate
    FROM 
      stats
    ON CONFLICT (account_id) 
    DO UPDATE SET
      campaign_count = EXCLUDED.campaign_count,
      total_emails = EXCLUDED.total_emails,
      total_opened = EXCLUDED.total_opened,
      total_clicked = EXCLUDED.total_clicked,
      total_bounced = EXCLUDED.total_bounced,
      avg_open_rate = EXCLUDED.avg_open_rate,
      avg_click_rate = EXCLUDED.avg_click_rate
    RETURNING to_jsonb(email_campaigns_stats.*)
  )
  SELECT jsonb_agg(to_jsonb) INTO result FROM inserted_stats;
  
  -- Si aucune ligne n'a été insérée (pas de statistiques trouvées)
  IF result IS NULL OR jsonb_array_length(result) = 0 THEN
    -- Créer une entrée vide avec INSERT ON CONFLICT DO UPDATE
    WITH inserted_empty AS (
      INSERT INTO email_campaigns_stats (
        account_id,
        campaign_count,
        total_emails,
        total_opened,
        total_clicked,
        total_bounced,
        avg_open_rate,
        avg_click_rate
      ) VALUES (
        account_id_param,
        0, 0, 0, 0, 0, 0, 0
      )
      ON CONFLICT (account_id)
      DO UPDATE SET
        campaign_count = 0,
        total_emails = 0,
        total_opened = 0,
        total_clicked = 0,
        total_bounced = 0,
        avg_open_rate = 0,
        avg_click_rate = 0
      RETURNING to_jsonb(email_campaigns_stats.*)
    )
    SELECT jsonb_agg(to_jsonb) INTO result FROM inserted_empty;
  END IF;
  
  -- Mettre à jour l'entrée de log
  UPDATE acelle_sync_logs
  SET details = details || jsonb_build_object(
    'completed_at', now(),
    'result', result
  )
  WHERE id = log_entry_id;
  
  RETURN result;
END;
$$;

-- Ajout d'une clé primaire sur account_id dans la table email_campaigns_stats si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la table existe et si elle n'a pas déjà une clé primaire
  IF (EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns_stats'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'email_campaigns_stats' AND constraint_type = 'PRIMARY KEY'
  )) THEN
    -- Ajouter une clé primaire
    ALTER TABLE email_campaigns_stats ADD PRIMARY KEY (account_id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Une erreur est survenue lors de la vérification/création de la clé primaire: %', SQLERRM;
END$$;

-- Créer une fonction pour synchroniser manuellement les statistiques entre les tables
CREATE OR REPLACE FUNCTION public.sync_campaign_statistics_manually(account_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Pour chaque campagne ayant des stats dans campaign_stats_cache
  -- mais pas dans email_campaigns_cache, mettre à jour email_campaigns_cache
  WITH stats_to_sync AS (
    SELECT 
      csc.account_id,
      csc.campaign_uid,
      csc.statistics,
      csc.last_updated
    FROM 
      campaign_stats_cache csc
    JOIN 
      email_campaigns_cache ecc 
    ON 
      csc.campaign_uid = ecc.campaign_uid 
      AND csc.account_id = ecc.account_id
    WHERE 
      csc.account_id = account_id_param
      AND (ecc.delivery_info IS NULL OR ecc.delivery_info->>'uniq_open_rate' IS NULL)
  )
  UPDATE email_campaigns_cache ecc
  SET 
    delivery_info = sts.statistics,
    cache_updated_at = NOW()
  FROM 
    stats_to_sync sts
  WHERE 
    ecc.campaign_uid = sts.campaign_uid
    AND ecc.account_id = sts.account_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Exécuter la mise à jour des statistiques agrégées
  SELECT update_acelle_campaign_stats(account_id_param) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaigns_updated', updated_count,
    'aggregate_result', result,
    'timestamp', now()
  );
END;
$$;

-- Test de la fonction de synchronisation manuelle
SELECT sync_campaign_statistics_manually('4a73ff46-a4e3-415f-a664-6ad0f8d29f01');
