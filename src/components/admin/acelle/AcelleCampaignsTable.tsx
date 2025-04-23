
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
}

export default function AcelleCampaignsTable({ account }: AcelleCampaignsTableProps) {
  const { 
    data: campaigns = [], 
    isLoading, 
    isError, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ["acelleCampaigns", account.id],
    queryFn: async () => {
      console.log("Fetching campaigns for account:", account);
      const campaigns = await acelleService.getAcelleCampaigns(account);
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
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'envoi</TableHead>
                <TableHead>Envoyés</TableHead>
                <TableHead>Taux d'ouverture</TableHead>
                <TableHead>Taux de clic</TableHead>
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
