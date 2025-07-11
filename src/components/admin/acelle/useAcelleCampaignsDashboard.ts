
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleCampaign, AcelleConnectionDebug } from '@/types/acelle.types';
import { useApiConnection } from '@/hooks/acelle/useApiConnection';
import { useCampaignCache } from '@/hooks/acelle/useCampaignCache';
import { useCampaignSync } from '@/hooks/acelle/useCampaignSync';
import { useAuthToken } from '@/hooks/acelle/useAuthToken';
import { toast } from 'sonner';

// Hook personnalisé pour le tableau de bord des campagnes
export const useAcelleCampaignsDashboard = (accounts: AcelleAccount[]) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [campaignsData, setCampaignsData] = useState<AcelleCampaign[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<AcelleConnectionDebug | null>(null);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Get auth token for API calls
  const { authToken, isRefreshing: isRefreshingToken, getValidAuthToken } = useAuthToken();
  
  // Filtrer les comptes actifs
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const active = accounts.filter(account => account.status === 'active');
      setActiveAccounts(active);
    } else {
      setActiveAccounts([]);
    }
  }, [accounts]);

  // Simulation de la récupération des campagnes
  const fetchCampaignsData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      // Si aucun compte actif, ne rien faire
      if (activeAccounts.length === 0) {
        setCampaignsData([]);
        return;
      }

      // Simulation de la récupération des données
      // Dans un cas réel, vous appelleriez une API ou récupéreriez des données du cache
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulation de données réussie
      const mockCampaigns = activeAccounts.flatMap(account => 
        Array(5).fill(null).map((_, index) => ({
          uid: `campaign-${account.id}-${index}`,
          name: `Campagne ${index + 1} de ${account.name}`,
          subject: `Sujet ${index + 1}`,
          status: ['sent', 'draft', 'queued', 'sending'][Math.floor(Math.random() * 4)],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          delivery_date: new Date().toISOString(),
          run_at: null,
          statistics: {
            subscriber_count: Math.floor(Math.random() * 1000) + 100,
            delivered_count: Math.floor(Math.random() * 900) + 50,
            delivered_rate: Math.random() * 0.9 + 0.1,
            open_count: Math.floor(Math.random() * 500),
            uniq_open_rate: Math.random() * 0.5,
            click_count: Math.floor(Math.random() * 300),
            click_rate: Math.random() * 0.3,
            bounce_count: Math.floor(Math.random() * 50),
            soft_bounce_count: Math.floor(Math.random() * 30),
            hard_bounce_count: Math.floor(Math.random() * 20),
            unsubscribe_count: Math.floor(Math.random() * 20),
            abuse_complaint_count: Math.floor(Math.random() * 5)
          }
        }))
      );
      
      // Mettre à jour les campagnes
      setCampaignsData(mockCampaigns);
    } catch (err) {
      console.error("Erreur lors de la récupération des campagnes:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      setSyncError("Erreur lors de la récupération des campagnes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [activeAccounts]);

  // Wake up Edge Functions and fetch data
  const handleRetry = useCallback(async () => {
    try {
      setIsLoading(true);
      setSyncError(null);
      
      // Ensure we have a valid token
      const token = authToken || await getValidAuthToken();
      
      if (!token) {
        throw new Error("Impossible d'obtenir un token d'authentification valide");
      }
      
      // Simulate waking up services
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API check
      const debugInfo = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        duration: 250,
        request: {
          url: "https://example.com/api/v1/wake",
          method: "GET"
        },
        response: {
          statusCode: 200,
          body: { status: "ok", message: "Service awoken successfully" }
        }
      };
      
      setDiagnosticInfo(debugInfo);
      
      // Fetch campaigns after waking up services
      await fetchCampaignsData();
      
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      setSyncError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, getValidAuthToken, fetchCampaignsData]);

  // Force synchronization
  const forceSyncNow = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading("Synchronisation forcée en cours...", { id: "force-sync" });
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLastManualSync(new Date());
      setSyncStatus({
        lastAutoSyncTime: new Date(),
        cachedCampaignsCount: Math.floor(Math.random() * 100) + 50,
        lastSyncResult: {
          success: true,
          message: "Synchronisation effectuée avec succès"
        }
      });
      
      // Re-fetch campaigns after sync
      await fetchCampaignsData();
      
      toast.success("Synchronisation forcée terminée", { id: "force-sync" });
    } catch (err) {
      console.error("Erreur lors de la synchronisation forcée:", err);
      setSyncError(err instanceof Error ? err.message : "Erreur pendant la synchronisation forcée");
      toast.error("Erreur lors de la synchronisation forcée", { id: "force-sync" });
    } finally {
      setIsLoading(false);
    }
  }, [fetchCampaignsData]);

  // Reset cache (simulated)
  const resetCache = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading("Nettoyage du cache en cours...", { id: "reset-cache" });
      
      // Simulate cache reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status after reset
      setSyncStatus(prevStatus => ({
        ...prevStatus,
        cachedCampaignsCount: 0,
        lastSyncResult: {
          success: true,
          message: "Cache vidé avec succès"
        }
      }));
      
      // Re-fetch data after cache reset
      await fetchCampaignsData();
      
      toast.success("Cache nettoyé avec succès", { id: "reset-cache" });
    } catch (err) {
      console.error("Erreur lors du nettoyage du cache:", err);
      toast.error("Erreur lors du nettoyage du cache", { id: "reset-cache" });
    } finally {
      setIsLoading(false);
    }
  }, [fetchCampaignsData]);

  // Initial data load
  useEffect(() => {
    fetchCampaignsData();
  }, [fetchCampaignsData]);

  return {
    activeAccounts,
    campaignsData,
    isLoading,
    isError,
    error,
    syncError,
    refetch: fetchCampaignsData,
    handleRetry,
    forceSyncNow,
    diagnosticInfo,
    resetCache,
    lastManualSync,
    syncStatus
  };
};
