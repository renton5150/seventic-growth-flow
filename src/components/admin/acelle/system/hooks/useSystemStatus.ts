
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AcelleAccount } from '@/types/acelle.types';
import { toast } from 'sonner';

export const useSystemStatus = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<Record<string, boolean>>({});
  const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState<{
    acelle: boolean;
    sync: boolean;
    latency: number;
    isAvailable: boolean;
  }>({
    acelle: false,
    sync: false,
    latency: 0,
    isAvailable: false
  });
  const [databaseStatus, setDatabaseStatus] = useState<{
    isConnected: boolean;
    count: number;
  }>({
    isConnected: false,
    count: 0
  });
  const [cachingStatus, setCachingStatus] = useState<{
    emailCampaignsCache: {
      totalRows: number;
      estimatedSize: string;
      lastUpdate: Date | null;
      accountsWithCache: number;
    };
    campaignStatsCache: {
      totalRows: number;
      estimatedSize: string;
      lastUpdate: Date | null;
      accountsWithCache: number;
    };
  }>({
    emailCampaignsCache: {
      totalRows: 0,
      estimatedSize: 'Inconnu',
      lastUpdate: null,
      accountsWithCache: 0
    },
    campaignStatsCache: {
      totalRows: 0,
      estimatedSize: 'Inconnu',
      lastUpdate: null,
      accountsWithCache: 0
    }
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    isLoggedIn: boolean;
    user: any;
  }>({
    isLoggedIn: false,
    user: null
  });
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  
  const { user } = useAuth();

  // Vérifier la connexion à la base de données
  const checkDatabaseConnection = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('acelle_accounts')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      setDatabaseStatus({
        isConnected: true,
        count: count || 0
      });
      
      return true;
    } catch (err) {
      console.error("Erreur de connexion à la base de données:", err);
      setDatabaseStatus({
        isConnected: false,
        count: 0
      });
      return false;
    }
  }, []);

  // Vérifier la disponibilité des Edge Functions
  const checkEdgeFunctions = useCallback(async () => {
    try {
      // Vérifier si nous avons un token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        console.error("Aucun token d'authentification disponible pour tester les Edge Functions");
        setEdgeFunctionsStatus({
          acelle: false,
          sync: false,
          latency: 0,
          isAvailable: false
        });
        return false;
      }
      
      // Test de l'Edge Function acelle-proxy avec un ping simple
      const startTime = performance.now();
      const response = await fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      const isAvailable = response.ok;
      
      setEdgeFunctionsStatus({
        acelle: isAvailable,
        sync: isAvailable, // On suppose que si l'un fonctionne, l'autre aussi
        latency,
        isAvailable
      });
      
      return isAvailable;
    } catch (err) {
      console.error("Erreur lors de la vérification des Edge Functions:", err);
      setEdgeFunctionsStatus({
        acelle: false,
        sync: false,
        latency: 0,
        isAvailable: false
      });
      return false;
    }
  }, []);

  // Vérifier l'état du cache
  const checkCacheStatus = useCallback(async () => {
    try {
      // Vérifier les statistiques du cache des campagnes
      const { count: campaignCount, error: campaignError } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true });
        
      if (campaignError) throw campaignError;
      
      // Obtenir la dernière mise à jour du cache des campagnes
      const { data: lastCampaignUpdate, error: updateError } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at')
        .order('cache_updated_at', { ascending: false })
        .limit(1)
        .single();
        
      // Récupérer le nombre de comptes distincts avec des campagnes en cache
      const { data: uniqueAccountsData } = await supabase
        .from('email_campaigns_cache')
        .select('account_id', { count: 'exact' })
        .limit(1);
      
      // Compter manuellement les comptes uniques
      const uniqueAccountsSet = new Set();
      const { data: allAccountsData } = await supabase
        .from('email_campaigns_cache')
        .select('account_id');
      
      if (allAccountsData) {
        allAccountsData.forEach(row => {
          if (row.account_id) {
            uniqueAccountsSet.add(row.account_id);
          }
        });
      }
      
      // Vérifier les statistiques du cache des statistiques de campagnes
      const { count: statsCount, error: statsError } = await supabase
        .from('campaign_stats_cache')
        .select('*', { count: 'exact', head: true });
        
      if (statsError) throw statsError;
      
      // Obtenir la dernière mise à jour du cache des statistiques
      const { data: lastStatsUpdate, error: statsUpdateError } = await supabase
        .from('campaign_stats_cache')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
        
      // Récupérer le nombre de comptes distincts avec des statistiques en cache
      const { data: uniqueStatsAccountsData } = await supabase
        .from('campaign_stats_cache')
        .select('account_id');
        
      // Compter manuellement les comptes uniques pour les statistiques
      const uniqueStatsAccountsSet = new Set();
      if (uniqueStatsAccountsData) {
        uniqueStatsAccountsData.forEach(row => {
          if (row.account_id) {
            uniqueStatsAccountsSet.add(row.account_id);
          }
        });
      }
          
      setCachingStatus({
        emailCampaignsCache: {
          totalRows: campaignCount || 0,
          estimatedSize: formatSizeInKB(campaignCount || 0, 2), // Estimation de 2 KB par entrée
          lastUpdate: lastCampaignUpdate?.cache_updated_at ? new Date(lastCampaignUpdate.cache_updated_at) : null,
          accountsWithCache: uniqueAccountsSet.size
        },
        campaignStatsCache: {
          totalRows: statsCount || 0,
          estimatedSize: formatSizeInKB(statsCount || 0, 5), // Estimation de 5 KB par entrée
          lastUpdate: lastStatsUpdate?.last_updated ? new Date(lastStatsUpdate.last_updated) : null,
          accountsWithCache: uniqueStatsAccountsSet.size
        }
      });
      
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification de l'état du cache:", err);
      return false;
    }
  }, []);

  // Format de taille en KB ou MB
  const formatSizeInKB = (count: number, sizePerRow: number): string => {
    const sizeInKB = count * sizePerRow;
    if (sizeInKB > 1024) {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
    return `${sizeInKB} KB`;
  };

  // Vérifier l'authentification
  const checkAuthStatus = useCallback(() => {
    setAuthStatus({
      isLoggedIn: !!user,
      user
    });
    
    return !!user;
  }, [user]);

  // Récupérer tous les comptes Acelle
  const getAcelleAccounts = useCallback(async (): Promise<AcelleAccount[]> => {
    try {
      const { data, error } = await supabase
        .from('acelle_accounts')
        .select('*');
        
      if (error) throw error;
      
      return data as AcelleAccount[];
    } catch (err) {
      console.error("Erreur lors de la récupération des comptes Acelle:", err);
      return [];
    }
  }, []);

  // Test de connexion à acelle-proxy
  const testEdgeFunctionConnection = useCallback(async (token: string | null): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.ok;
    } catch (err) {
      console.error("Erreur lors du test de connexion à l'Edge Function:", err);
      return false;
    }
  }, []);

  // Rafraîchir tous les statuts
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    
    try {
      const dbStatus = await checkDatabaseConnection();
      const authOk = checkAuthStatus();
      const edgeFunctionsOk = await checkEdgeFunctions();
      await checkCacheStatus();
      
      setSystemStatus({
        database: dbStatus,
        auth: authOk,
        edgeFunctions: edgeFunctionsOk,
      });
    } catch (err) {
      console.error("Erreur lors de l'actualisation des statuts:", err);
      toast.error("Erreur lors de la vérification des statuts");
    } finally {
      setIsLoading(false);
    }
  }, [checkDatabaseConnection, checkAuthStatus, checkEdgeFunctions, checkCacheStatus]);

  // Exécuter les tests de diagnostic
  const performTests = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading("Exécution des tests de diagnostic...", { id: "diagnostic" });
      
      // Obtenez le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        toast.error("Aucun token d'authentification disponible", { id: "diagnostic" });
        return;
      }
      
      // Test 1: Vérifier la connexion à l'Edge Function
      const edgeFunctionConnected = await testEdgeFunctionConnection(token);
      
      // Test 2: Vérifier la base de données
      const dbConnected = await checkDatabaseConnection();
      
      // Test 3: Vérifier l'état du cache
      await checkCacheStatus();
      
      // Résultats compilés
      const results = {
        timestamp: new Date().toISOString(),
        auth: {
          isLoggedIn: !!user,
          token: !!token
        },
        edgeFunction: {
          connected: edgeFunctionConnected,
          latency: edgeFunctionsStatus.latency
        },
        database: {
          connected: dbConnected,
          accountsCount: databaseStatus.count
        },
        cache: {
          campaigns: cachingStatus.emailCampaignsCache.totalRows,
          stats: cachingStatus.campaignStatsCache.totalRows
        }
      };
      
      setDiagnosticResult(results);
      toast.success("Tests de diagnostic terminés", { id: "diagnostic" });
      
      return results;
    } catch (err) {
      console.error("Erreur lors de l'exécution des tests:", err);
      toast.error("Erreur lors des tests de diagnostic", { id: "diagnostic" });
    } finally {
      setIsLoading(false);
    }
  }, [user, testEdgeFunctionConnection, checkDatabaseConnection, checkCacheStatus, edgeFunctionsStatus.latency, databaseStatus.count, cachingStatus]);

  // Exécuter la vérification initiale au chargement
  useEffect(() => {
    refreshStatus();
    
    // Rafraîchir automatiquement toutes les 60 secondes (si voulu)
    // const interval = setInterval(refreshStatus, 60000);
    // return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    isLoading,
    systemStatus,
    refreshStatus,
    edgeFunctionsStatus,
    databaseStatus,
    cachingStatus,
    lastRefresh,
    authStatus,
    performTests,
    diagnosticResult,
    getAcelleAccounts,
    testEdgeFunctionConnection
  };
};
