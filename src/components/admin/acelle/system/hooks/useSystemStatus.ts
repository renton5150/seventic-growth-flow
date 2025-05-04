
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemStatus {
  accounts: number;
  campaigns: number;
  cacheAge: {
    min: number;
    max: number;
    avg: number;
    lastUpdate: string | null;
  };
  apiStatus: {
    proxyAvailable: boolean;
    lastCheck: string | null;
    latency: number | null;
  };
  storageInfo: {
    cacheRows: number;
    cacheSize: string;
  };
  edgeFunctions: {
    available: string[];
    status: 'available' | 'unavailable' | 'loading';
    lastCheck: string | null;
  };
}

export const useSystemStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus>({
    accounts: 0,
    campaigns: 0,
    cacheAge: {
      min: 0,
      max: 0,
      avg: 0,
      lastUpdate: null,
    },
    apiStatus: {
      proxyAvailable: false,
      lastCheck: null,
      latency: null,
    },
    storageInfo: {
      cacheRows: 0,
      cacheSize: '0 KB',
    },
    edgeFunctions: {
      available: [],
      status: 'loading',
      lastCheck: null,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Vérifier la disponibilité des fonctions Edge
  const checkEdgeFunctions = useCallback(async () => {
    try {
      // Tester la fonction acelle-proxy
      const response = await fetch('https://emailing.plateforme-solution.net/api/v1/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        return {
          status: 'available' as const,
          available: ['acelle-proxy'],
          lastCheck: new Date().toISOString(),
        };
      } else {
        return {
          status: 'unavailable' as const,
          available: [],
          lastCheck: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error("Erreur lors de la vérification des fonctions Edge:", e);
      return {
        status: 'unavailable' as const,
        available: [],
        lastCheck: new Date().toISOString(),
      };
    }
  }, []);

  // Calculer la taille de la cache
  const calculateCacheSize = useCallback(async () => {
    try {
      // Compter le nombre de lignes dans la cache
      const { count: campaignsCount, error: campaignsError } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true });
      
      if (campaignsError) {
        throw campaignsError;
      }
      
      const { count: statsCount, error: statsError } = await supabase
        .from('campaign_stats_cache')
        .select('*', { count: 'exact', head: true });
      
      if (statsError) {
        throw statsError;
      }
      
      // Estimation de la taille (approximative)
      const avgRowSizeKB = 5; // 5 KB par ligne en moyenne
      const totalRows = (campaignsCount || 0) + (statsCount || 0);
      const totalSizeKB = totalRows * avgRowSizeKB;
      
      // Formater la taille
      let sizeStr: string;
      if (totalSizeKB > 1024) {
        sizeStr = `${(totalSizeKB / 1024).toFixed(1)} MB`;
      } else {
        sizeStr = `${totalSizeKB.toFixed(0)} KB`;
      }
      
      return {
        cacheRows: totalRows,
        cacheSize: sizeStr,
      };
    } catch (e) {
      console.error("Erreur lors du calcul de la taille du cache:", e);
      return {
        cacheRows: 0,
        cacheSize: 'Erreur',
      };
    }
  }, []);

  // Calculer les statistiques de l'âge du cache
  const calculateCacheAge = useCallback(async () => {
    try {
      // Récupérer des statistiques sur l'âge du cache
      const { data, error } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at');
      
      if (error) {
        throw error;
      }
      
      if (!data?.length) {
        return {
          min: 0,
          max: 0,
          avg: 0,
          lastUpdate: null,
        };
      }
      
      // Calculer l'âge pour chaque entrée en minutes
      const now = new Date();
      const ages = data
        .filter(item => item.cache_updated_at)
        .map(item => {
          const updatedAt = new Date(item.cache_updated_at);
          const ageMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
          return ageMinutes;
        });
        
      if (ages.length === 0) {
        return {
          min: 0,
          max: 0,
          avg: 0,
          lastUpdate: null,
        };
      }
        
      // Calculer min, max et moyenne
      const min = Math.min(...ages);
      const max = Math.max(...ages);
      const avg = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      
      // Trouver la date de mise à jour la plus récente
      const mostRecent = data
        .filter(item => item.cache_updated_at)
        .sort((a, b) => new Date(b.cache_updated_at).getTime() - new Date(a.cache_updated_at).getTime())[0];
        
      return {
        min: Math.round(min),
        max: Math.round(max),
        avg: Math.round(avg),
        lastUpdate: mostRecent?.cache_updated_at || null,
      };
    } catch (e) {
      console.error("Erreur lors du calcul de l'âge du cache:", e);
      return {
        min: 0,
        max: 0,
        avg: 0,
        lastUpdate: null,
      };
    }
  }, []);

  // Récupérer les informations complètes du système
  const fetchSystemStatus = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Nombre de comptes Acelle
      const { count: accountsCount, error: accountsError } = await supabase
        .from('acelle_accounts')
        .select('*', { count: 'exact', head: true });
      
      if (accountsError) throw accountsError;
      
      // Nombre de campagnes en cache
      const { count: campaignsCount, error: campaignsError } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true });
      
      if (campaignsError) throw campaignsError;
      
      // Vérifier les edge functions
      const edgeFunctionsStatus = await checkEdgeFunctions();
      
      // Taille du cache
      const storageInfo = await calculateCacheSize();
      
      // Age du cache
      const cacheAge = await calculateCacheAge();
      
      setStatus({
        accounts: accountsCount || 0,
        campaigns: campaignsCount || 0,
        cacheAge,
        apiStatus: {
          proxyAvailable: edgeFunctionsStatus.status === 'available',
          lastCheck: edgeFunctionsStatus.lastCheck,
          latency: 0,
        },
        storageInfo,
        edgeFunctions: edgeFunctionsStatus,
      });
      
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Erreur lors de la récupération du statut système:", errorMessage);
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [checkEdgeFunctions, calculateCacheSize, calculateCacheAge]);

  // Récupération initiale du statut
  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  return {
    isLoading,
    status,
    error,
    refresh: fetchSystemStatus,
    isRefreshing,
    lastRefresh,
  };
};
