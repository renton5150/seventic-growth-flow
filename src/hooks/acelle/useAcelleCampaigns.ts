
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleCampaign, AcelleConnectionDebug } from "@/types/acelle.types";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { forceSyncCampaigns } from '@/services/acelle/api/campaigns';
import { calculateDeliveryStats } from '@/utils/acelle/campaignStats';

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [campaignsData, setCampaignsData] = useState<AcelleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<AcelleConnectionDebug | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    lastAutoSyncTime: Date | null;
    lastManualSyncTime: Date | null;
    cachedCampaignsCount: number;
    lastSyncError: string | null;
    lastSyncResult: { success: boolean; message: string } | null;
  } | null>(null);

  // Get active accounts
  const activeAccounts = accounts.filter(account => account.status === 'active');

  // Récupérer le token d'authentification
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Authentication token retrieved for API requests");
          setAccessToken(token);
        } else {
          console.error("No authentication token available in session");
          toast.error("Erreur d'authentification");
        }
      } catch (error) {
        console.error("Error getting authentication token:", error);
      }
    };
    
    getAuthToken();
  }, []);

  // Fonction pour extraire les campagnes du cache
  const extractCampaignsFromCache = (cachedData: any[]): AcelleCampaign[] => {
    console.log(`Extracting ${cachedData.length} campaigns from cache`);
    
    return cachedData.map(item => {
      // Transformer les données du cache en objets AcelleCampaign
      return {
        uid: item.campaign_uid,
        campaign_uid: item.campaign_uid,
        name: item.name,
        subject: item.subject,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        delivery_date: item.delivery_date,
        run_at: item.run_at,
        delivery_info: item.delivery_info || null,
        last_error: item.last_error
      };
    });
  };

  // Fonction pour récupérer l'état du cache
  const getCacheStatus = async (accountId: string) => {
    console.log(`Getting cache status for account ${accountId}`);
    
    try {
      // Compter les campagnes en cache pour ce compte
      const { count: campaignsCount, error: countError } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      if (countError) {
        console.error(`Error counting cached campaigns for account ${accountId}:`, countError);
        return { campaignsCount: 0, lastSyncDate: null, lastSyncError: countError.message };
      }
      
      // Obtenir les informations de synchronisation du compte
      const { data: accountData, error: accountError } = await supabase
        .from('acelle_accounts')
        .select('last_sync_date, last_sync_error')
        .eq('id', accountId)
        .single();
      
      if (accountError) {
        console.error(`Error getting sync status for account ${accountId}:`, accountError);
        return { 
          campaignsCount: campaignsCount || 0, 
          lastSyncDate: null, 
          lastSyncError: accountError.message 
        };
      }
      
      return {
        campaignsCount: campaignsCount || 0,
        lastSyncDate: accountData?.last_sync_date || null,
        lastSyncError: accountData?.last_sync_error || null
      };
    } catch (e) {
      console.error(`Error getting cache status for account ${accountId}:`, e);
      return { 
        campaignsCount: 0, 
        lastSyncDate: null, 
        lastSyncError: e instanceof Error ? e.message : String(e)
      };
    }
  };

  // Fetch campaigns data
  const fetchCampaigns = useCallback(async () => {
    if (activeAccounts.length === 0) {
      setIsLoading(false);
      setCampaignsData([]);
      return;
    }
    
    if (!accessToken) {
      console.log("Waiting for authentication token...");
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    
    try {
      console.log(`Fetching campaigns for ${activeAccounts.length} active accounts`);
      
      // Fetch campaigns from cache first for immediate display
      const { data: cachedCampaigns, error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .in('account_id', activeAccounts.map(account => account.id))
        .order('created_at', { ascending: false });
        
      if (cacheError) {
        console.error("Error fetching campaigns from cache:", cacheError);
      } else if (cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache`);
        const formattedCampaigns = extractCampaignsFromCache(cachedCampaigns);
        setCampaignsData(formattedCampaigns);
      }
      
      // Get cache status for all accounts
      const statuses = await Promise.all(
        activeAccounts.map(async (account) => {
          return getCacheStatus(account.id);
        })
      );
      
      // Compute overall cache status
      const totalCachedCampaigns = statuses.reduce((total, status) => total + status.campaignsCount, 0);
      const lastErrors = statuses
        .filter(s => s.lastSyncError)
        .map(s => s.lastSyncError);
        
      // Find the most recent sync date
      let mostRecentSync: Date | null = null;
      
      for (const status of statuses) {
        if (status.lastSyncDate) {
          const syncDate = new Date(status.lastSyncDate);
          if (!mostRecentSync || syncDate > mostRecentSync) {
            mostRecentSync = syncDate;
          }
        }
      }
      
      setSyncStatus({
        lastAutoSyncTime: mostRecentSync,
        lastManualSyncTime: null,
        cachedCampaignsCount: totalCachedCampaigns,
        lastSyncError: lastErrors.length > 0 ? lastErrors[0] : null,
        lastSyncResult: null
      });
      
      setIsLoading(false);
      setIsError(false);
    } catch (e) {
      console.error("Error fetching campaigns:", e);
      setError(e instanceof Error ? e : new Error('Unknown error'));
      setIsError(true);
      setSyncError(e instanceof Error ? e.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [activeAccounts, accessToken]);

  // Initial fetch and refresh on account changes
  useEffect(() => {
    if (accessToken) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, accessToken]);

  // Retry mechanism
  const handleRetry = useCallback(async () => {
    try {
      // Wake up edge functions first
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (token) {
        await supabase.functions.invoke('sync-email-campaigns', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: { startServices: true }
        });
      }
      
      // Then retry fetching
      await fetchCampaigns();
    } catch (e) {
      console.error("Error during retry:", e);
      setError(e instanceof Error ? e : new Error('Failed to retry'));
    }
  }, [fetchCampaigns]);
  
  // Handle forced sync
  const forceSyncNow = useCallback(async () => {
    if (activeAccounts.length === 0) return;
    
    try {
      toast.loading("Synchronisation des données...", { id: "sync-toast" });
      
      // Force sync for the first active account (or consider syncing all)
      const result = await forceSyncCampaigns(activeAccounts[0], accessToken);
      
      if (result.success) {
        toast.success(result.message, { id: "sync-toast" });
        setLastManualSync(new Date());
        setSyncStatus(prev => prev ? {
          ...prev,
          lastManualSyncTime: new Date(),
          lastSyncResult: result
        } : null);
        // Refresh data
        await fetchCampaigns();
      } else {
        toast.error(result.message, { id: "sync-toast" });
        setSyncStatus(prev => prev ? {
          ...prev,
          lastSyncError: result.message,
          lastSyncResult: result
        } : null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error during forced sync:", errorMessage);
      toast.error(`Erreur: ${errorMessage}`, { id: "sync-toast" });
    }
  }, [activeAccounts, accessToken, fetchCampaigns]);
  
  // Reset cache and refetch
  const resetCache = useCallback(async () => {
    if (activeAccounts.length === 0) return;
    
    try {
      // Clear cache for all active accounts
      for (const account of activeAccounts) {
        await supabase
          .from('email_campaigns_cache')
          .delete()
          .eq('account_id', account.id);
      }
      
      // Update sync status
      setSyncStatus(prev => prev ? {
        ...prev,
        cachedCampaignsCount: 0,
        lastSyncResult: {
          success: true,
          message: "Cache vidé avec succès"
        }
      } : null);
      
      // Force a new sync
      await forceSyncNow();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error resetting cache:", errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    }
  }, [activeAccounts, forceSyncNow]);

  // Set up periodic refresh
  useEffect(() => {
    // Refresh every 5 minutes
    const intervalId = setInterval(() => {
      if (!isLoading) {
        console.log("Periodic refresh triggered");
        fetchCampaigns();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchCampaigns, isLoading]);

  return {
    campaignsData,
    isLoading,
    isError,
    error,
    syncError,
    activeAccounts,
    refetch: fetchCampaigns,
    handleRetry,
    diagnosticInfo,
    forceSyncNow,
    resetCache,
    lastManualSync,
    syncStatus
  };
};
