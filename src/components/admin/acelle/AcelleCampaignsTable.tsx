
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
import { AcelleAccount } from "@/types/acelle.types";
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

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const fetchCampaigns = React.useCallback(async () => {
    console.log(`Fetching campaigns for account: ${account.name}, page: ${currentPage}, limit: ${itemsPerPage}`);
    try {
      // Clear any previous connection errors
      setConnectionError(null);
      
      // First check API accessibility
      const isAccessible = await acelleService.checkApiAccess(account);
      if (!isAccessible) {
        console.error(`API not accessible for account: ${account.name}`);
        setConnectionError(`L'API Acelle Mail n'est pas accessible pour le compte ${account.name}. Veuillez vérifier la configuration du compte.`);
        return [];
      }
      
      // If accessible, fetch campaigns
      return acelleService.getAcelleCampaigns(account, currentPage, itemsPerPage);
    } catch (error) {
      console.error(`Error fetching campaigns:`, error);
      setConnectionError(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    queryKey: ["acelleCampaigns", account.id, currentPage, itemsPerPage],
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

  if (account.status === "inactive") {
    return <InactiveAccountState />;
  }

  if (isLoading) {
    return <TableLoadingState />;
  }

  if (isError || connectionError) {
    return (
      <TableErrorState 
        onRetry={() => refetch()} 
        errorMessage={connectionError || "Une erreur est survenue lors de la récupération des campagnes"}
      />
    );
  }

  return (
    <div className="space-y-4">
      <CampaignsTableHeader 
        accountName={account.name}
        onRefresh={() => refetch()}
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
                    key={campaign.uid}
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
