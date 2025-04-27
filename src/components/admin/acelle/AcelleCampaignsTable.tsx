import React, { useState } from "react";
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
import * as acelleService from "@/services/acelle";
import { AcelleTableFilters } from "./table/AcelleTableFilters";
import { AcelleTableRow } from "./table/AcelleTableRow";
import { CampaignsTableHeader } from "./table/TableHeader";
import { TablePagination } from "./table/TablePagination";
import {
  LoadingState as TableLoadingState,
  ErrorState as TableErrorState,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const fetchCampaigns = React.useCallback(async () => {
    console.log(`Fetching campaigns for account: ${account.name}`);
    return acelleService.getAcelleCampaigns(account);
  }, [account]);
  
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
  
  const filteredCampaigns = React.useMemo(() => {
    return campaigns
      .filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(campaign => !statusFilter || campaign.status === statusFilter)
      .sort((a, b) => {
        let valueA: any;
        let valueB: any;

        if (sortBy === "created_at" || sortBy === "updated_at" || sortBy === "run_at") {
          valueA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
          valueB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
        } else if (sortBy === "name" || sortBy === "subject" || sortBy === "status") {
          valueA = (a[sortBy] || "").toLowerCase();
          valueB = (b[sortBy] || "").toLowerCase();
        } else if (sortBy === "open_rate") {
          valueA = a.delivery_info?.unique_open_rate || 0;
          valueB = b.delivery_info?.unique_open_rate || 0;
        } else if (sortBy === "click_rate") {
          valueA = a.delivery_info?.click_rate || 0;
          valueB = b.delivery_info?.click_rate || 0;
        } else {
          valueA = 0;
          valueB = 0;
        }

        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      });
  }, [campaigns, searchTerm, statusFilter, sortBy, sortOrder]);

  React.useEffect(() => {
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

  if (isError) {
    return <TableErrorState onRetry={() => refetch()} />;
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
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
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
          
          <TablePagination
            currentPage={currentPage}
            hasNextPage={campaigns.length === itemsPerPage}
            onPageChange={handlePageChange}
            isLoading={isFetching}
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
