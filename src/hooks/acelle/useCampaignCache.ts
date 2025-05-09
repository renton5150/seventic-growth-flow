
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from '@/types/acelle.types';

interface UseCampaignCacheProps {
  campaignsCount: number;
  lastRefreshTimestamp: string | null;
  isCacheBusy: boolean;
  getCachedCampaignsCount: () => Promise<number>;
  clearAccountCache: () => Promise<void>;
  checkCacheStatistics: () => Promise<{ count: number, lastUpdated: string | null }>;
}

export const useCampaignCache = (account: AcelleAccount): UseCampaignCacheProps => {
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<string | null>(null);
  const [isCacheBusy, setIsCacheBusy] = useState(false);

  // Vérifier le nombre de campagnes en cache
  const getCachedCampaignsCount = useCallback(async () => {
    if (!account?.id) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', account.id);
      
      if (error) {
        console.error("Erreur lors du comptage des campagnes:", error);
        return 0;
      }
      
      setCampaignsCount(count || 0);
      return count || 0;
    } catch (err) {
      console.error("Erreur lors du comptage des campagnes:", err);
      return 0;
    }
  }, [account?.id]);

  // Vérifier la date de dernière mise à jour du cache
  const checkCacheStatistics = useCallback(async () => {
    if (!account?.id) {
      return { count: 0, lastUpdated: null };
    }
    
    try {
      // Obtenir l'entrée la plus récente pour la date de dernière mise à jour
      const { data, error } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at')
        .eq('account_id', account.id)
        .order('cache_updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Erreur lors de la vérification du cache:", error);
        return { count: 0, lastUpdated: null };
      }
      
      // Récupérer le nombre total d'entrées dans le cache
      const count = await getCachedCampaignsCount();
      
      const lastUpdated = data && data.length > 0 ? data[0].cache_updated_at : null;
      setLastRefreshTimestamp(lastUpdated);
      
      return { count, lastUpdated };
    } catch (err) {
      console.error("Erreur lors de la vérification du cache:", err);
      return { count: 0, lastUpdated: null };
    }
  }, [account?.id, getCachedCampaignsCount]);

  // Vider le cache pour un compte spécifique
  const clearAccountCache = useCallback(async () => {
    if (!account?.id) {
      return;
    }
    
    setIsCacheBusy(true);
    
    try {
      const { error } = await supabase
        .from('email_campaigns_cache')
        .delete()
        .eq('account_id', account.id);
      
      if (error) {
        console.error("Erreur lors de la suppression du cache:", error);
        return;
      }
      
      setCampaignsCount(0);
      setLastRefreshTimestamp(null);
    } catch (err) {
      console.error("Erreur lors de la suppression du cache:", err);
    } finally {
      setIsCacheBusy(false);
    }
  }, [account?.id]);

  // Vérifier le statut du cache au chargement
  useEffect(() => {
    if (account?.id) {
      getCachedCampaignsCount();
      checkCacheStatistics();
    }
  }, [account?.id, getCachedCampaignsCount, checkCacheStatistics]);

  return {
    campaignsCount,
    lastRefreshTimestamp,
    isCacheBusy,
    getCachedCampaignsCount,
    clearAccountCache,
    checkCacheStatistics,
  };
};
