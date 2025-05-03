
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { EmptyState } from "../table/LoadingAndErrorStates";
import { AcelleTableRow } from "../table/AcelleTableRow";
import { CampaignsTableHeader } from "../table/TableHeader";
import { AcelleTableBatchLoader } from "../table/AcelleTableBatchLoader";
import { useAcelleCampaignsTable } from "@/hooks/acelle/useAcelleCampaignsTable";

interface TableContentProps {
  campaigns: AcelleCampaign[];
  account: AcelleAccount;
  onViewCampaign: (uid: string) => void;
  demoMode: boolean;
  onStatLoaded: (campaignUid: string, stats: AcelleCampaignStatistics) => void;
  onBatchLoadComplete: (statsMap: Map<string, AcelleCampaignStatistics>) => void;
  loadingStats: boolean;
  statsLoadedCount: number;
}

export function TableContent({
  campaigns,
  account,
  onViewCampaign,
  demoMode,
  onStatLoaded,
  onBatchLoadComplete,
  loadingStats,
  statsLoadedCount
}: TableContentProps) {
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
  } = useAcelleCampaignsTable(campaigns || []);

  // Si aucune campagne n'est trouvée
  if (!filteredCampaigns?.length && !demoMode) {
    return <EmptyState onSync={undefined} />;
  }

  return (
    <>
      {/* Chargeur par lots (invisible) pour optimiser le chargement des statistiques */}
      {!demoMode && loadingStats && (
        <AcelleTableBatchLoader 
          campaigns={filteredCampaigns} 
          account={account}
          onBatchLoadComplete={onBatchLoadComplete}
        />
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <CampaignsTableHeader 
                columns={[
                  { key: "name", label: "Nom" },
                  { key: "subject", label: "Sujet" },
                  { key: "status", label: "Statut" },
                  { key: "delivery_date", label: "Date d'envoi" },
                  { key: "subscriber_count", label: "Destinataires" },
                  { key: "open_rate", label: "Taux d'ouverture" },
                  { key: "click_rate", label: "Taux de clic" },
                  { key: "bounce_count", label: "Bounces" },
                  { key: "", label: "" }
                ]}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(column) => {
                  if (sortBy === column) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(column);
                    setSortOrder("desc");
                  }
                }}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <AcelleTableRow 
                key={campaign.uid || campaign.campaign_uid} 
                campaign={campaign} 
                account={account}
                onViewCampaign={onViewCampaign}
                demoMode={demoMode}
                onStatsLoaded={onStatLoaded}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {loadingStats && statsLoadedCount < filteredCampaigns.length && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4 mr-2" />
          Chargement des statistiques ({statsLoadedCount}/{filteredCampaigns.length})...
        </div>
      )}
    </>
  );
}
