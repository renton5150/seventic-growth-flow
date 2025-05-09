
-- Fonction pour mettre à jour les statistiques agrégées
CREATE OR REPLACE FUNCTION public.update_acelle_campaign_stats(account_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Supprimer les anciennes statistiques pour ce compte
  DELETE FROM email_campaigns_stats WHERE account_id = account_id_param;
  
  -- Calculer et insérer les nouvelles statistiques agrégées
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
  RETURNING to_jsonb(email_campaigns_stats.*) INTO result;
  
  -- Si aucune ligne n'a été insérée (pas de statistiques trouvées)
  IF result IS NULL THEN
    -- Créer une entrée vide
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
    RETURNING to_jsonb(email_campaigns_stats.*) INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Ajouter une fonction de déclenchement pour synchroniser les statistiques
CREATE OR REPLACE FUNCTION public.sync_campaign_stats_cache_to_delivery_info()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mettre à jour delivery_info dans email_campaigns_cache
  UPDATE email_campaigns_cache
  SET 
    delivery_info = NEW.statistics,
    cache_updated_at = NEW.last_updated
  WHERE 
    campaign_uid = NEW.campaign_uid AND 
    account_id = NEW.account_id;
    
  RETURN NEW;
END;
$$;

-- Créer le déclencheur sur la table campaign_stats_cache
DROP TRIGGER IF EXISTS sync_stats_to_delivery_info_trigger ON campaign_stats_cache;
CREATE TRIGGER sync_stats_to_delivery_info_trigger
AFTER INSERT OR UPDATE ON campaign_stats_cache
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_stats_cache_to_delivery_info();
