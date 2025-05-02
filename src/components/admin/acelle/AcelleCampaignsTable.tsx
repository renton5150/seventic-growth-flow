
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import { CampaignsTableHeader } from "./table/TableHeader";
import { CampaignsTablePagination } from "./table/TablePagination";
import {
  TableLoadingState,
  TableErrorState,
  EmptyState,
  InactiveAccountState
} from "./table/LoadingAndErrorStates";
import AcelleCampaignDetails from "./AcelleCampaignDetails";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // Pour forcer le rechargement
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Function to wake up Edge Functions
  const wakeUpEdgeFunctions = async () => {
    try {
      console.log("Attempting to wake up Edge Functions");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error("No auth session available for wake-up request");
        return false;
      }
      
      const wakeUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping';
      console.log(`Sending wake-up request to: ${wakeUrl}`);
      
      try {
        const response = await fetch(wakeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Edge Function wake-up successful:", data);
          return true;
        } else {
          console.error(`Edge Function wake-up failed: ${response.status}`);
        }
      } catch (e) {
        console.warn("Wake-up request failed, this is expected in development environment:", e);
      }
      
      // Even if wake-up failed, return true to continue with the flow
      return true;
    } catch (e) {
      console.error("Error in wakeUpEdgeFunctions:", e);
      return false;
    }
  };
  
  const fetchCampaigns = React.useCallback(async () => {
    console.log(`Fetching campaigns for account: ${account.name}, page: ${currentPage}, limit: ${itemsPerPage}`);
    try {
      // Clear any previous connection errors
      setConnectionError(null);
      toast.loading("Récupération des campagnes en cours...", { id: "fetch-campaigns" });
      
      // Try to wake up Edge Functions but don't block on it
      wakeUpEdgeFunctions().catch(console.error);
      
      // Skip API accessibility check for now and fetch campaigns directly
      console.log("Fetching campaigns directly");
      const campaigns = await acelleService.getAcelleCampaigns(account, currentPage, itemsPerPage);
      
      if (campaigns && campaigns.length > 0) {
        console.log(`Successfully retrieved ${campaigns.length} campaigns`);
        toast.success(`${campaigns.length} campagnes récupérées avec succès`, { id: "fetch-campaigns" });
        return campaigns;
      } else {
        console.log("No campaigns returned from API, showing mock campaigns");
        toast.warning("Données temporaires affichées pour démonstration", { id: "fetch-campaigns" });
        return [];
      }
    } catch (error) {
      console.error(`Error fetching campaigns:`, error);
      setConnectionError(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      toast.error("Erreur lors de la récupération des campagnes", { id: "fetch-campaigns" });
      return [];
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [account, currentPage, itemsPerPage]);
  
  const { 
    data: campaigns = [], 
    isLoading, 
    isError,
    isFetching,
    error,
    refetch 
  } = useQuery({
    queryKey: ["acelleCampaigns", account.id, currentPage, itemsPerPage, retryCount],
    queryFn: fetchCampaigns,
    enabled: account.status === "active",
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredCampaigns
  } = useAcelleCampaignsTable(campaigns);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Function to force a new attempt
  const handleRetry = () => {
    setIsManuallyRefreshing(true);
    setRetryCount(prev => prev + 1);
    refetch();
  };
  
  // Toggle debug info
  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };

  if (account.status === "inactive") {
    return <InactiveAccountState />;
  }

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (isError || connectionError) {
    return (
      <TableErrorState 
        onRetry={handleRetry}
        errorMessage={connectionError || "Une erreur est survenue lors de la récupération des campagnes"}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campagnes pour {account.name}</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDebugInfo}
          >
            {showDebugInfo ? "Masquer" : "Afficher"} les infos de débogage
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry} 
            disabled={isFetching || isManuallyRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching || isManuallyRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>
      
      {showDebugInfo && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950">
          <CardContent className="p-4 text-sm">
            <h4 className="font-bold mb-2">Informations de débogage</h4>
            <div className="space-y-1">
              <p><strong>Endpoint API:</strong> {account.apiEndpoint}</p>
              <p><strong>Dernière synchronisation:</strong> {account.lastSyncDate ? new Date(account.lastSyncDate).toLocaleString() : 'Jamais'}</p>
              {account.lastSyncError && (
                <p className="text-red-600"><strong>Dernière erreur:</strong> {account.lastSyncError}</p>
              )}
              <p><strong>Status de la requête:</strong> {isLoading ? 'Chargement' : (isError ? 'Erreur' : 'Succès')}</p>
              {error && (
                <p className="text-red-600">
                  <strong>Erreur:</strong> {error instanceof Error ? error.message : 'Erreur inconnue'}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Note: Pour le moment, les données affichées sont des exemples pour simulation. La connexion à l'API réelle sera rétablie prochainement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AcelleTableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />
      
      {campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="border rounded-md relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                <Spinner className="h-8 w-8 border-primary" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'envoi</TableHead>
                  <TableHead>Envoyés</TableHead>
                  <TableHead>Livraisons</TableHead>
                  <TableHead>Taux d'ouv.</TableHead>
                  <TableHead>Taux de clic</TableHead>
                  <TableHead>Bounces</TableHead>
                  <TableHead>Désabonnements</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <AcelleTableRow
                    key={campaign.uid || campaign.campaign_uid}
                    campaign={campaign}
                    onViewCampaign={(uid) => setSelectedCampaign(uid)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          
          <CampaignsTablePagination
            currentPage={currentPage}
            hasNextPage={campaigns.length === itemsPerPage}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl h-[80vh] max-h-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la campagne</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <AcelleCampaignDetails 
              account={account}
              campaignUid={selectedCampaign}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
