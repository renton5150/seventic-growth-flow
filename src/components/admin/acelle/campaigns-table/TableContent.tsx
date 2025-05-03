
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
import { useCampaignStatsCache } from "@/hooks/acelle/useCampaignStatsCache";

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

  const { enrichCampaignWithCachedStats, getAllCachedStats } = useCampaignStatsCache();
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [localLoadingStats, setLocalLoadingStats] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  // CORRECTION: Enrichir les campagnes filtrées avec les stats en cache au premier rendu
  useEffect(() => {
    if (!isInitialLoadComplete && filteredCampaigns.length > 0) {
      console.log("[TableContent] Enrichissement initial des campagnes avec les stats en cache");
      
      // Enrichir chaque campagne avec ses stats en cache
      const allCachedStats = getAllCachedStats();
      const enrichedCount = filteredCampaigns.reduce((count, campaign) => {
        const uid = campaign.uid || campaign.campaign_uid || '';
        if (uid && allCachedStats.has(uid)) {
          campaign.statistics = allCachedStats.get(uid)!;
          return count + 1;
        }
        return count;
      }, 0);
      
      console.log(`[TableContent] ${enrichedCount}/${filteredCampaigns.length} campagnes enrichies avec des stats en cache`);
      
      setLoadedCount(enrichedCount);
      setIsInitialLoadComplete(true);
      
      // Si toutes les campagnes ont des stats, arrêter le chargement
      if (enrichedCount === filteredCampaigns.length) {
        setLocalLoadingStats(false);
      }
    }
  }, [filteredCampaigns, isInitialLoadComplete, getAllCachedStats, enrichCampaignWithCachedStats]);

  // CORRECTION: Gérer le comptage des stats chargées
  const handleStatLoaded = (campaignUid: string, stats: AcelleCampaignStatistics) => {
    // Incrémenter le compteur local de statistiques chargées
    setLoadedCount(prev => {
      const newCount = prev + 1;
      
      // Si toutes les campagnes ont des stats, arrêter le chargement
      if (newCount >= filteredCampaigns.length) {
        setLocalLoadingStats(false);
      }
      
      return newCount;
    });
    
    // Propager l'événement au parent si nécessaire
    if (onStatLoaded) {
      onStatLoaded(campaignUid, stats);
    }
  };
  
  // CORRECTION: Gérer la fin du chargement par lots
  const handleBatchLoadComplete = (statsMap: Map<string, AcelleCampaignStatistics>) => {
    console.log(`[TableContent] Chargement par lots terminé avec ${statsMap.size} statistiques`);
    
    // Propager l'événement au parent si nécessaire
    if (onBatchLoadComplete) {
      onBatchLoadComplete(statsMap);
    }
    
    // Mise à jour de l'état de chargement si toutes les campagnes ont des stats
    if (statsMap.size >= filteredCampaigns.length || 
        loadedCount + statsMap.size >= filteredCampaigns.length) {
      setLocalLoadingStats(false);
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
      {!demoMode && isLoading && (
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
