import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AcelleAccount } from '@/types/acelle.types';
import { toast } from 'sonner';
import { checkAcelleConnectionStatus } from '@/services/acelle/api/connection';

export const useSystemStatus = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<Record<string, boolean>>({});
  const [acelleApiStatus, setAcelleApiStatus] = useState<{
    isAvailable: boolean;
    accountsCount: number;
    activeAccountsCount: number;
    lastTestTime: Date | null;
  }>({
    isAvailable: false,
    accountsCount: 0,
    activeAccountsCount: 0,
    lastTestTime: null
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

  // Vérifier la disponibilité de l'API Acelle directement
  const checkAcelleApiAvailability = useCallback(async () => {
    try {
      // Récupérer tous les comptes Acelle
      const { data: accounts, error } = await supabase
        .from('acelle_accounts')
        .select('*');
      
      if (error) throw error;
      
      let activeAccountsCount = 0;
      let successfulConnections = 0;
      
      // Tester la connexion pour chaque compte
      for (const account of accounts || []) {
        try {
          const result = await checkAcelleConnectionStatus(account as AcelleAccount);
          
          if (result.success) {
            successfulConnections++;
            
            // Mettre à jour le statut du compte s'il n'est pas actif
            if (account.status !== 'active') {
              await supabase
                .from('acelle_accounts')
                .update({ status: 'active' })
                .eq('id', account.id);
            }
            activeAccountsCount++;
          } else {
            console.error(`Connexion échouée pour ${account.name}:`, result.message);
            
            // Mettre à jour le statut du compte en erreur
            if (account.status !== 'error') {
              await supabase
                .from('acelle_accounts')
                .update({ 
                  status: 'error',
                  last_sync_error: result.message 
                })
                .eq('id', account.id);
            }
          }
        } catch (err) {
          console.error(`Erreur lors du test de connexion pour ${account.name}:`, err);
          
          // Mettre à jour le statut du compte en erreur
          await supabase
            .from('acelle_accounts')
            .update({ 
              status: 'error',
              last_sync_error: err instanceof Error ? err.message : "Erreur inconnue"
            })
            .eq('id', account.id);
        }
      }
      
      const isAvailable = successfulConnections > 0;
      
      setAcelleApiStatus({
        isAvailable,
        accountsCount: accounts?.length || 0,
        activeAccountsCount,
        lastTestTime: new Date()
      });
      
      return isAvailable;
    } catch (err) {
      console.error("Erreur lors de la vérification de l'API Acelle:", err);
      setAcelleApiStatus({
        isAvailable: false,
        accountsCount: 0,
        activeAccountsCount: 0,
        lastTestTime: new Date()
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
      const { data: allAccountsData } = await supabase
        .from('email_campaigns_cache')
        .select('account_id');
      
      const uniqueAccountsSet = new Set();
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
          estimatedSize: formatSizeInKB(campaignCount || 0, 2),
          lastUpdate: lastCampaignUpdate?.cache_updated_at ? new Date(lastCampaignUpdate.cache_updated_at) : null,
          accountsWithCache: uniqueAccountsSet.size
        },
        campaignStatsCache: {
          totalRows: statsCount || 0,
          estimatedSize: formatSizeInKB(statsCount || 0, 5),
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

  // Test de connexion direct à l'API Acelle
  const testAcelleApiConnection = useCallback(async (): Promise<boolean> => {
    try {
      const accounts = await getAcelleAccounts();
      
      if (accounts.length === 0) {
        return false;
      }
      
      // Tester au moins un compte
      const testAccount = accounts.find(acc => acc.status === 'active') || accounts[0];
      const result = await checkAcelleConnectionStatus(testAccount);
      
      return result.success;
    } catch (err) {
      console.error("Erreur lors du test de connexion à l'API Acelle:", err);
      return false;
    }
  }, [getAcelleAccounts]);

  // Rafraîchir tous les statuts
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    
    try {
      const dbStatus = await checkDatabaseConnection();
      const authOk = checkAuthStatus();
      const acelleApiOk = await checkAcelleApiAvailability();
      await checkCacheStatus();
      
      setSystemStatus({
        database: dbStatus,
        auth: authOk,
        acelleApi: acelleApiOk,
      });
    } catch (err) {
      console.error("Erreur lors de l'actualisation des statuts:", err);
      toast.error("Erreur lors de la vérification des statuts");
    } finally {
      setIsLoading(false);
    }
  }, [checkDatabaseConnection, checkAuthStatus, checkAcelleApiAvailability, checkCacheStatus]);

  // Exécuter les tests de diagnostic
  const performTests = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading("Exécution des tests de diagnostic...", { id: "diagnostic" });
      
      // Test de l'API Acelle directe
      const acelleApiConnected = await testAcelleApiConnection();
      
      // Test de la base de données
      const dbConnected = await checkDatabaseConnection();
      
      // Vérifier l'état du cache
      await checkCacheStatus();
      
      // Résultats compilés
      const results = {
        timestamp: new Date().toISOString(),
        auth: {
          isLoggedIn: !!user,
          hasValidSession: !!user
        },
        acelleApi: {
          connected: acelleApiConnected,
          accountsCount: acelleApiStatus.accountsCount,
          activeAccountsCount: acelleApiStatus.activeAccountsCount
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
  }, [user, testAcelleApiConnection, checkDatabaseConnection, checkCacheStatus, acelleApiStatus, databaseStatus.count, cachingStatus]);

  // Exécuter la vérification initiale au chargement
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    isLoading,
    systemStatus,
    refreshStatus,
    acelleApiStatus,
    databaseStatus,
    cachingStatus,
    lastRefresh,
    authStatus,
    performTests,
    diagnosticResult,
    getAcelleAccounts,
    testEdgeFunctionConnection: testAcelleApiConnection
  };
};
