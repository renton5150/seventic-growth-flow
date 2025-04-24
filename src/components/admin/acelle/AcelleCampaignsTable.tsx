
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcelleAccount } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import AcelleCampaignDetails from "./AcelleCampaignDetails";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { 
    data: campaigns = [], 
    isLoading, 
    isError, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ["acelleCampaigns", account.id, currentPage, itemsPerPage],
    queryFn: async () => {
      console.log(`Fetching campaigns for account: ${account.name}, page: ${currentPage}, limit: ${itemsPerPage}`);
      const campaigns = await acelleService.getAcelleCampaigns(account, currentPage, itemsPerPage);
      console.log("Fetched campaigns:", campaigns);
      return campaigns;
    },
    enabled: account.status === "active",
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
    selectedCampaign,
    setSelectedCampaign,
    filteredCampaigns
  } = useAcelleCampaignsTable(campaigns);

  if (account.status === "inactive") {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">Le compte est inactif. Activez-le pour voir les campagnes.</p>
      </div>
    );
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading state for initial load
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/20">
        <p className="text-red-500 mb-4">Erreur lors du chargement des campagnes</p>
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campagnes - {account.name}</h2>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline"
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser
            </>
          )}
        </Button>
      </div>
      
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
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Aucune campagne trouvée pour ce compte</p>
        </div>
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
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {[...Array(Math.min(3, currentPage))].map((_, i) => {
                const pageNumber = currentPage - (Math.min(3, currentPage) - i);
                return (
                  <PaginationItem key={`prev-${pageNumber}`}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNumber);
                      }}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {currentPage + 1 <= 10 && (
                <PaginationItem>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  >
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {currentPage + 2 <= 10 && (
                <PaginationItem>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 2);
                    }}
                  >
                    {currentPage + 2}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (campaigns.length === itemsPerPage) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={campaigns.length < itemsPerPage ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
