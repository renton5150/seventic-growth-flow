
import React, { useState, useEffect } from "react";
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
  onStatLoaded?: (campaignUid: string, stats: AcelleCampaignStatistics) => void;
  onBatchLoadComplete?: (statsMap: Map<string, AcelleCampaignStatistics>) => void;
  loadingStats?: boolean;
  statsLoadedCount?: number;
}

export function TableContent({
  campaigns,
  account,
  onViewCampaign,
  demoMode,
  onStatLoaded,
  onBatchLoadComplete,
  loadingStats = false,
  statsLoadedCount = 0
}: TableContentProps) {
  const {
    filteredCampaigns
  } = useAcelleCampaignsTable(campaigns || []);

  const [localLoadingStats, setLocalLoadingStats] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  // Log des campagnes pour débogage
  useEffect(() => {
    console.log(`[TableContent] Traitement de ${campaigns.length} campagnes`);
    if (campaigns.length > 0) {
      console.log('[TableContent] Exemple de campagne:', campaigns[0]);
    }
  }, [campaigns]);
  
  // Gérer la fin du chargement par lots
  const handleBatchLoadComplete = (statsMap: Map<string, AcelleCampaignStatistics>) => {
    console.log(`[TableContent] Chargement par lots terminé avec ${statsMap.size} statistiques`);
    
    // Propager l'événement au parent si nécessaire
    if (onBatchLoadComplete) {
      onBatchLoadComplete(statsMap);
    }
    
    // Mise à jour de l'état de chargement
    setLocalLoadingStats(false);
  };

  // Gérer le comptage des stats chargées
  const handleStatLoaded = (campaignUid: string, stats: AcelleCampaignStatistics) => {
    console.log(`[TableContent] Stat chargée pour ${campaignUid}`);
    
    // Incrémenter le compteur local de statistiques chargées
    setLoadedCount(prev => prev + 1);
    
    // Propager l'événement au parent si nécessaire
    if (onStatLoaded) {
      onStatLoaded(campaignUid, stats);
    }
  };

  // Si aucune campagne n'est trouvée
  if (!filteredCampaigns?.length && !demoMode) {
    return <EmptyState onSync={undefined} />;
  }

  // Déterminer l'état de chargement
  const isLoading = loadingStats || localLoadingStats;
  const currentStatsLoadedCount = statsLoadedCount || loadedCount;

  return (
    <>
      {/* Chargeur par lots (invisible) pour optimiser le chargement des statistiques */}
      {!demoMode && (
        <AcelleTableBatchLoader 
          campaigns={filteredCampaigns} 
          account={account}
          demoMode={demoMode}
          onBatchLoadComplete={handleBatchLoadComplete}
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
                sortBy="name"
                sortOrder="desc"
                onSort={() => {}}
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
                onStatsLoaded={handleStatLoaded}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {isLoading && currentStatsLoadedCount < filteredCampaigns.length && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4 mr-2" />
          Chargement des statistiques ({currentStatsLoadedCount}/{filteredCampaigns.length})...
        </div>
      )}
    </>
  );
}
