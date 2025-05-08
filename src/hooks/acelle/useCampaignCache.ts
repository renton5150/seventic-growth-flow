
import { useState, useCallback, useEffect } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseCampaignCacheProps {
  account: AcelleAccount;
}

export const useCampaignCache = (account: AcelleAccount) => {
  const [campaignsCount, setCampaignsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<string | null>(null);
  const [isCacheBusy, setIsCacheBusy] = useState<boolean>(false);

  /**
   * Obtient le nombre de campagnes en cache pour ce compte
   */
  const getCachedCampaignsCount = useCallback(async () => {
    if (!account?.id) {
      setCampaignsCount(0);
      return 0;
    }

    try {
      setIsLoading(true);
      
      // Récupérer le nombre de campagnes en cache
      const { count, error } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', account.id);
      
      if (error) {
        console.error("Erreur lors du comptage des campagnes:", error);
        return 0;
      }
      
      console.log(`${count || 0} campagnes trouvées en cache pour le compte ${account.name}`);
      setCampaignsCount(count || 0);
      setLastRefreshed(new Date());
      setLastRefreshTimestamp(new Date().toISOString());
      
      // Obtenir également les statistiques agrégées
      const { data: statsData } = await supabase
        .from('email_campaigns_stats')
        .select('*')
        .eq('account_id', account.id)
        .maybeSingle();
      
      if (statsData) {
        console.log("Statistiques agrégées récupérées:", {
          open_rate: statsData.avg_open_rate,
          click_rate: statsData.avg_click_rate
        });
      }
      
      return count || 0;
    } catch (error) {
      console.error("Erreur lors de la récupération du nombre de campagnes:", error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [account]);
  
  /**
   * Vérifie si les statistiques de campagnes sont disponibles
   */
  const checkCacheStatistics = useCallback(async () => {
    if (!account?.id) return null;
    
    try {
      setIsCacheBusy(true);
      
      // Vérifier les statistiques agrégées
      const { data, error } = await supabase
        .from('email_campaigns_stats')
        .select('*')
        .eq('account_id', account.id)
        .maybeSingle();
        
      if (error) {
        console.error("Erreur lors de la vérification des statistiques:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Exception lors de la vérification des statistiques:", error);
      return null;
    } finally {
      setIsCacheBusy(false);
    }
  }, [account]);
  
  /**
   * Vide le cache des campagnes pour ce compte
   */
  const clearAccountCache = useCallback(async () => {
    if (!account?.id) return false;
    
    try {
      toast.loading("Suppression du cache...", { id: "clear-cache" });
      
      console.log(`Suppression du cache pour le compte ${account.name}`);
      
      // Supprimer les campagnes en cache
      const { error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .delete()
        .eq('account_id', account.id);
      
      if (cacheError) {
        console.error("Erreur lors de la suppression du cache des campagnes:", cacheError);
        toast.error("Erreur lors de la suppression du cache", { id: "clear-cache" });
        return false;
      }
      
      // Supprimer les statistiques en cache
      const { error: statsError } = await supabase
        .from('campaign_stats_cache')
        .delete()
        .eq('account_id', account.id);
        
      if (statsError) {
        console.error("Erreur lors de la suppression du cache des statistiques:", statsError);
        toast.error("Erreur lors de la suppression du cache des statistiques", { id: "clear-cache" });
        return false;
      }
      
      // Supprimer les statistiques agrégées
      const { error: aggError } = await supabase
        .from('email_campaigns_stats')
        .delete()
        .eq('account_id', account.id);
        
      if (aggError) {
        console.error("Erreur lors de la suppression des statistiques agrégées:", aggError);
        toast.error("Erreur lors de la suppression des statistiques agrégées", { id: "clear-cache" });
        return false;
      }
      
      // Rafraîchir le compteur
      setCampaignsCount(0);
      
      toast.success("Cache supprimé avec succès", { id: "clear-cache" });
      return true;
    } catch (error) {
      console.error("Exception lors de la suppression du cache:", error);
      toast.error("Erreur lors de la suppression du cache", { id: "clear-cache" });
      return false;
    }
  }, [account]);

  // Initialiser le compteur au chargement
  useEffect(() => {
    if (account?.id) {
      getCachedCampaignsCount();
    }
  }, [account, getCachedCampaignsCount]);

  return {
    campaignsCount,
    isLoading,
    lastRefreshed,
    lastRefreshTimestamp,
    isCacheBusy,
    getCachedCampaignsCount,
    clearAccountCache,
    checkCacheStatistics
  };
};
