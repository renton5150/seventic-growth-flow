
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

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0); // Pour forcer le rechargement

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
        return false;
      }
    } catch (e) {
      console.error("Error waking up Edge Functions:", e);
      return false;
    }
  };
  
  const fetchCampaigns = React.useCallback(async () => {
    console.log(`Fetching campaigns for account: ${account.name}, page: ${currentPage}, limit: ${itemsPerPage}`);
    try {
      // Clear any previous connection errors
      setConnectionError(null);
      toast.loading("Récupération des campagnes en cours...", { id: "fetch-campaigns" });
      
      // First try to wake up Edge Functions
      await wakeUpEdgeFunctions();
      
      // Check API accessibility
      const isAccessible = await acelleService.checkApiAccess(account);
      if (!isAccessible) {
        console.error(`API not accessible for account: ${account.name}`);
        setConnectionError(`L'API Acelle Mail n'est pas accessible pour le compte ${account.name}. Vérifiant le cache...`);
        
        // Try to get campaigns from cache
        try {
          console.log("Fetching campaigns from cache...");
          const cachedCampaigns = await fetchCampaignsFromCache([account]);
            
          if (cachedCampaigns && cachedCampaigns.length > 0) {
            console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache for account ${account.name}`);
            toast.success("Données chargées depuis le cache", { id: "fetch-campaigns" });
            
            // Apply pagination to the cached campaigns
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return cachedCampaigns.slice(startIndex, endIndex);
          } else {
            console.log("No cached campaigns found");
            toast.error("Aucune campagne dans le cache", { id: "fetch-campaigns" });
          }
        } catch (cacheError) {
          console.error(`Error retrieving campaigns from cache:`, cacheError);
          toast.error("Erreur lors de la récupération du cache", { id: "fetch-campaigns" });
        }
        
        return [];
      }
      
      // If accessible, fetch campaigns
      console.log("API accessible, fetching live campaigns");
      const campaigns = await acelleService.getAcelleCampaigns(account, currentPage, itemsPerPage);
      toast.success("Campagnes récupérées avec succès", { id: "fetch-campaigns" });
      return campaigns;
    } catch (error) {
      console.error(`Error fetching campaigns:`, error);
      setConnectionError(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      toast.error("Erreur lors de la récupération des campagnes", { id: "fetch-campaigns" });
      return [];
    }
  }, [account, currentPage, itemsPerPage]);
  
  const { 
    data: campaigns = [], 
    isLoading, 
    isError,
    isFetching,
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
    setRetryCount(prev => prev + 1);
    refetch();
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
      <CampaignsTableHeader 
        accountName={account.name}
        onRefresh={handleRetry}
        isSyncing={isFetching}
      />
      
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
