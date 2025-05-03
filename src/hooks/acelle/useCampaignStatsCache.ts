
import { useState, useCallback, useRef, useEffect } from 'react';
import { AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";

// Interface pour définir la structure des données en cache
interface CachedStats {
  campaignUid: string;
  statistics: AcelleCampaignStatistics;
  timestamp: number;
  expiresAt: number;
}

interface UseCampaignStatsCacheOptions {
  // Durée de validité du cache en ms (30 minutes par défaut)
  cacheDuration?: number;
  // Taille maximale du cache (100 campagnes par défaut)
  cacheSize?: number;
}

export const useCampaignStatsCache = (options: UseCampaignStatsCacheOptions = {}) => {
  // Définir les options par défaut
  const {
    cacheDuration = 30 * 60 * 1000, // 30 minutes
    cacheSize = 100,
  } = options;
  
  // Utiliser useRef pour garder le cache entre les rendus
  const cacheRef = useRef<Map<string, CachedStats>>(new Map());
  const [cacheState, setCacheState] = useState<{
    size: number;
    lastUpdated: Date | null;
  }>({
    size: 0,
    lastUpdated: null,
  });
  
  // Fonction pour stocker des statistiques dans le cache
  const cacheStats = useCallback((campaignUid: string, statistics: AcelleCampaignStatistics) => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    // Si le cache est plein, supprimer l'entrée la plus ancienne
    if (cache.size >= cacheSize && !cache.has(campaignUid)) {
      // Trouver l'entrée la plus ancienne
      let oldestKey = '';
      let oldestTime = Infinity;
      
      cache.forEach((value, key) => {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      });
      
      // Supprimer l'entrée la plus ancienne
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    // Ajouter ou mettre à jour l'entrée dans le cache
    cache.set(campaignUid, {
      campaignUid,
      statistics,
      timestamp: now,
      expiresAt: now + cacheDuration,
    });
    
    // Mettre à jour l'état du cache pour déclencher un re-rendu si nécessaire
    setCacheState({
      size: cache.size,
      lastUpdated: new Date(),
    });
    
    console.log(`[StatsCache] Statistiques mises en cache pour ${campaignUid}`, statistics);
    return statistics;
  }, [cacheDuration, cacheSize]);
  
  // Fonction pour récupérer des statistiques du cache
  const getStatsFromCache = useCallback((campaignUid: string): AcelleCampaignStatistics | null => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    // Vérifier si la campagne est dans le cache
    if (cache.has(campaignUid)) {
      const cachedData = cache.get(campaignUid)!;
      
      // Vérifier si les données ne sont pas expirées
      if (cachedData.expiresAt > now) {
        console.log(`[StatsCache] Cache hit pour ${campaignUid}`);
        return cachedData.statistics;
      } else {
        // Supprimer les données expirées
        console.log(`[StatsCache] Données expirées pour ${campaignUid}`);
        cache.delete(campaignUid);
        return null;
      }
    }
    
    console.log(`[StatsCache] Cache miss pour ${campaignUid}`);
    return null;
  }, []);
  
  // Fonction pour invalider une entrée du cache
  const invalidateCacheEntry = useCallback((campaignUid: string) => {
    const cache = cacheRef.current;
    const deleted = cache.delete(campaignUid);
    
    if (deleted) {
      console.log(`[StatsCache] Cache invalidé pour ${campaignUid}`);
      setCacheState({
        size: cache.size,
        lastUpdated: new Date(),
      });
    }
    
    return deleted;
  }, []);
  
  // Fonction pour nettoyer le cache des entrées expirées
  const cleanupCache = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let cleanedCount = 0;
    
    cache.forEach((value, key) => {
      if (value.expiresAt <= now) {
        cache.delete(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[StatsCache] ${cleanedCount} entrées expirées nettoyées`);
      setCacheState({
        size: cache.size,
        lastUpdated: new Date(),
      });
    }
    
    return cleanedCount;
  }, []);
  
  // Nettoyage périodique du cache
  useEffect(() => {
    const interval = setInterval(cleanupCache, 5 * 60 * 1000); // Nettoyer toutes les 5 minutes
    return () => clearInterval(interval);
  }, [cleanupCache]);
  
  // Enrichir une campagne avec ses statistiques en cache
  const enrichCampaignWithCachedStats = useCallback((campaign: AcelleCampaign): AcelleCampaign => {
    const campaignUid = campaign.uid || campaign.campaign_uid || '';
    
    if (!campaignUid) {
      return campaign;
    }
    
    const cachedStats = getStatsFromCache(campaignUid);
    
    // Si les stats sont en cache, les ajouter à la campagne
    if (cachedStats) {
      return {
        ...campaign,
        statistics: cachedStats,
      };
    }
    
    return campaign;
  }, [getStatsFromCache]);
  
  return {
    cacheStats,
    getStatsFromCache,
    invalidateCacheEntry,
    cleanupCache,
    enrichCampaignWithCachedStats,
    cacheInfo: cacheState,
  };
};
