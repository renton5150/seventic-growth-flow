
import { useState, useEffect } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour gérer les opérations de cache des campagnes
 */
export const useCampaignCache = (account: AcelleAccount) => {
  const [campaignsCount, setCampaignsCount] = useState<number>(0);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<Date | null>(null);
  const [isCacheBusy, setIsCacheBusy] = useState<boolean>(false);

  // Rafraîchir automatiquement le compte des campagnes en cache
  useEffect(() => {
    if (account?.id) {
      // Vérifier immédiatement
      getCachedCampaignsCount();
      
      // Configurer un intervalle pour actualiser périodiquement le comptage
      const refreshInterval = setInterval(() => {
        getCachedCampaignsCount();
      }, 60 * 1000); // Actualiser chaque minute
      
      return () => clearInterval(refreshInterval);
    }
  }, [account?.id]);

  // Obtenir le nombre de campagnes en cache
  const getCachedCampaignsCount = async () => {
    try {
      if (!account?.id) {
        return 0;
      }
      
      console.log(`Comptage des campagnes en cache pour le compte ${account.name}`);
      
      const { count, error } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', account.id);
      
      if (error) {
        console.error("Erreur lors du comptage des campagnes en cache:", error);
        return 0;
      }
      
      const actualCount = count || 0;
      console.log(`${actualCount} campagnes trouvées en cache pour le compte ${account.name}`);
      setCampaignsCount(actualCount);
      setLastRefreshTimestamp(new Date());
      return actualCount;
    } catch (error) {
      console.error("Erreur lors du comptage des campagnes en cache:", error);
      return 0;
    }
  };

  // Vérifier si les statistiques sont disponibles dans le cache
  const checkCacheStatistics = async () => {
    setIsCacheBusy(true);
    try {
      if (!account?.id) {
        setIsCacheBusy(false);
        return { hasStats: false, totalCampaigns: 0, campaignsWithStats: 0 };
      }
      
      // Récupérer un échantillon de campagnes pour vérifier les statistiques
      // Utiliser une limite plus grande pour une meilleure vérification
      const { data, error } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .eq('account_id', account.id)
        .limit(20);
      
      if (error || !data) {
        console.error("Erreur lors de la vérification des statistiques en cache:", error);
        setIsCacheBusy(false);
        return { hasStats: false, totalCampaigns: 0, campaignsWithStats: 0 };
      }
      
      // Vérifier quelles campagnes ont des statistiques en vérifiant delivery_info
      const campaignsWithStats = data.filter(campaign => {
        // Vérifier que delivery_info est un objet avant d'accéder à ses propriétés
        const deliveryInfo = campaign.delivery_info as Record<string, any> | null;
        
        if (!deliveryInfo || typeof deliveryInfo !== 'object') {
          return false;
        }
        
        // Vérifier plusieurs propriétés pour s'assurer qu'il y a des données
        const hasBasicStats = 
          (typeof deliveryInfo.total === 'number' && deliveryInfo.total > 0) ||
          (typeof deliveryInfo.delivered === 'number' && deliveryInfo.delivered > 0);
          
        // Vérifier les taux pour plus de précision  
        const hasRates =
          (typeof deliveryInfo.delivery_rate === 'number' && deliveryInfo.delivery_rate > 0) ||
          (typeof deliveryInfo.unique_open_rate === 'number' && deliveryInfo.unique_open_rate > 0) ||
          (typeof deliveryInfo.click_rate === 'number' && deliveryInfo.click_rate > 0);
          
        return hasBasicStats || hasRates;
      });
      
      console.log(`Vérification du cache: ${campaignsWithStats.length}/${data.length} campagnes ont des statistiques`);
      
      // Extraire de manière sécurisée les statistiques d'exemple
      let sampleStats = null;
      if (campaignsWithStats.length > 0) {
        const sampleCampaign = campaignsWithStats[0];
        // S'assurer que delivery_info est un objet avant de le retourner
        if (sampleCampaign.delivery_info && typeof sampleCampaign.delivery_info === 'object') {
          sampleStats = sampleCampaign.delivery_info;
        }
      }
      
      // Vérifier si les données sont plus récentes que 30 minutes
      const hasRecentData = data.some(campaign => {
        const cacheUpdatedAt = new Date(campaign.cache_updated_at);
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
        
        return cacheUpdatedAt > thirtyMinutesAgo;
      });
      
      const result = {
        hasStats: campaignsWithStats.length > 0,
        totalCampaigns: data.length,
        campaignsWithStats: campaignsWithStats.length,
        hasRecentData,
        sampleStats
      };
      
      setIsCacheBusy(false);
      return result;
    } catch (error) {
      console.error("Erreur lors de la vérification des statistiques en cache:", error);
      setIsCacheBusy(false);
      return { hasStats: false, totalCampaigns: 0, campaignsWithStats: 0 };
    }
  };

  // Effacer le cache pour un compte
  const clearAccountCache = async () => {
    try {
      if (!account?.id) {
        return { success: false, error: "ID de compte invalide" };
      }
      
      setIsCacheBusy(true);
      const { error } = await supabase
        .from('email_campaigns_cache')
        .delete()
        .eq('account_id', account.id);
      
      if (error) {
        setIsCacheBusy(false);
        return { success: false, error: error.message };
      }
      
      setCampaignsCount(0);
      setIsCacheBusy(false);
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du cache du compte:", error);
      setIsCacheBusy(false);
      return { success: false, error: String(error) };
    }
  };

  return {
    campaignsCount,
    getCachedCampaignsCount,
    clearAccountCache,
    checkCacheStatistics,
    lastRefreshTimestamp,
    isCacheBusy
  };
};
