
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
  const [isTesting, setIsTesting] = useState(false);
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
  const [endpointStatus, setEndpointStatus] = useState({ isAvailable: false, latency: 0 });
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState({ isLoggedIn: false, user: null });
  const [activeTab, setActiveTab] = useState("status");
  const [cacheInfo, setCacheInfo] = useState({ 
    totalRows: 0, 
    estimatedSize: '0 KB', 
    lastUpdate: null,
    accountsWithCache: 0
  });

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

  // Réveiller les edge functions
  const wakeUpEdgeFunctions = useCallback(async (token: string | null) => {
    try {
      setIsTesting(true);
      
      // Test simple de l'endpoint
      const startTime = performance.now();
      const response = await fetch('https://emailing.plateforme-solution.net/api/v1/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      const isAvailable = response.ok;
      setEndpointStatus({ isAvailable, latency });
      
      // Mettre à jour le statut global
      setStatus(prev => ({
        ...prev,
        apiStatus: {
          ...prev.apiStatus,
          proxyAvailable: isAvailable,
          lastCheck: new Date().toISOString(),
          latency: latency
        }
      }));
      
      setLastTestTime(new Date());
      
      try {
        const respData = await response.json();
        setDebugInfo({
          endpoint: 'https://emailing.plateforme-solution.net/api/v1/me',
          status: response.status,
          latency: `${latency}ms`,
          data: respData,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (jsonError) {
        setDebugInfo({
          endpoint: 'https://emailing.plateforme-solution.net/api/v1/me',
          status: response.status,
          latency: `${latency}ms`,
          error: 'Impossible de parser la réponse JSON',
          text: await response.text()
        });
      }
      
      return isAvailable;
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      setEndpointStatus({ isAvailable: false, latency: 0 });
      setDebugInfo({
        endpoint: 'https://emailing.plateforme-solution.net/api/v1/me',
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Mettre à jour le statut global
      setStatus(prev => ({
        ...prev,
        apiStatus: {
          ...prev.apiStatus,
          proxyAvailable: false,
          lastCheck: new Date().toISOString(),
          latency: null
        }
      }));
      
      setLastTestTime(new Date());
      return false;
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Vérifier la disponibilité de l'API
  const checkApiAvailability = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || null;
    return await wakeUpEdgeFunctions(token);
  }, [wakeUpEdgeFunctions]);

  // Actualiser les informations de cache
  const refreshCacheInfo = useCallback(async () => {
    try {
      // Compter les lignes de cache
      const { count: campaignsCount, error: campaignsError } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true });
      
      // Compter le nombre de comptes avec du cache
      const { data: accountsData, error: accountsError } = await supabase
        .from('email_campaigns_cache')
        .select('account_id')
        .distinct('account_id');
        
      // Récupérer la date de mise à jour la plus récente
      const { data: recentData, error: recentError } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at')
        .order('cache_updated_at', { ascending: false })
        .limit(1);
      
      if (!campaignsError) {
        // Calcul de la taille estimée
        const totalRows = campaignsCount || 0;
        const avgRowSizeKB = 5; // 5 KB par ligne en moyenne
        const totalSizeKB = totalRows * avgRowSizeKB;
        
        // Formater la taille
        let sizeStr: string;
        if (totalSizeKB > 1024) {
          sizeStr = `${(totalSizeKB / 1024).toFixed(1)} MB`;
        } else {
          sizeStr = `${totalSizeKB.toFixed(0)} KB`;
        }
        
        setCacheInfo({
          totalRows,
          estimatedSize: sizeStr,
          lastUpdate: recentData && recentData.length > 0 ? recentData[0].cache_updated_at : null,
          accountsWithCache: accountsData && !accountsError ? accountsData.length : 0
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'actualisation des informations de cache:", error);
    }
  }, []);

  // Vérifier les informations de débogage
  const getDebugInfo = useCallback(async () => {
    try {
      // Récupérer la session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Mettre à jour le statut d'authentification
      setAuthStatus({
        isLoggedIn: !!sessionData?.session?.user,
        user: sessionData?.session?.user || null
      });
      
      // Vérifier si le token est disponible
      if (sessionData?.session?.access_token) {
        // Réveil des fonctions edge avec le token
        await wakeUpEdgeFunctions(sessionData.session.access_token);
      } else {
        // Réveil sans token
        await wakeUpEdgeFunctions(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de débogage:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }, [wakeUpEdgeFunctions]);

  // Exécuter un diagnostic complet
  const runDiagnostics = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Vérifier l'authentification
      await getDebugInfo();
      
      // Récupérer les informations sur les comptes
      const { count: accountsCount } = await supabase
        .from('acelle_accounts')
        .select('*', { count: 'exact', head: true });
      
      // Récupérer les informations sur les campagnes en cache
      const { count: campaignsCount } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true });
      
      // Récupérer les informations sur l'âge du cache
      const cacheAge = await calculateCacheAge();
      
      // Vérifier les fonctions edge
      const edgeFunctionsStatus = await checkEdgeFunctions();
      
      // Récupérer la taille du cache
      const storageInfo = await calculateCacheSize();
      
      // Mettre à jour les informations de cache
      await refreshCacheInfo();
      
      // Mettre à jour l'état global
      setStatus({
        accounts: accountsCount || 0,
        campaigns: campaignsCount || 0,
        cacheAge,
        apiStatus: {
          proxyAvailable: edgeFunctionsStatus.status === 'available',
          lastCheck: edgeFunctionsStatus.lastCheck,
          latency: endpointStatus.latency || 0,
        },
        storageInfo,
        edgeFunctions: edgeFunctionsStatus,
      });
      
      setLastRefresh(new Date());
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Erreur lors du diagnostic:", errorMessage);
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [
    calculateCacheAge, 
    calculateCacheSize, 
    checkEdgeFunctions, 
    endpointStatus.latency, 
    getDebugInfo,
    refreshCacheInfo
  ]);

  // Récupération initiale du statut
  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  return {
    isLoading,
    isTesting,
    status,
    error,
    refresh: runDiagnostics,
    isRefreshing,
    lastRefresh,
    endpointStatus,
    lastTestTime,
    debugInfo,
    authStatus,
    activeTab,
    setActiveTab,
    cacheInfo,
    wakeUpEdgeFunctions,
    refreshCacheInfo,
    getDebugInfo,
    runDiagnostics
  };
};
