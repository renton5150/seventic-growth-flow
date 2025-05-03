
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { AcelleTableRow } from "../table/AcelleTableRow";
import { CampaignsTableHeader } from "../table/TableHeader";
import { AcelleTableBatchLoader } from "../table/AcelleTableBatchLoader";
import { toast } from "sonner";
import { enrichCampaignsWithStats } from "@/services/acelle/api/directStats";

interface TableContentProps {
  campaigns: AcelleCampaign[];
  account?: AcelleAccount;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
}

export const TableContent = ({
  campaigns,
  account,
  sortBy,
  sortOrder,
  onSort,
  onViewCampaign,
  demoMode = false
}: TableContentProps) => {
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [enrichedCampaigns, setEnrichedCampaigns] = useState<AcelleCampaign[]>([]);

  // À chaque changement de campagnes, réinitialiser l'état du chargement des statistiques
  useEffect(() => {
    setIsStatsLoaded(false);
    
    // Always try to enrich campaigns with statistics when campaigns change
    const loadStats = async () => {
      console.log(`Trying to enrich ${campaigns.length} campaigns with statistics`);
      if (campaigns.length > 0 && account) {
        try {
          // Use the enrichCampaignsWithStats function to load statistics from cache
          const result = await enrichCampaignsWithStats(campaigns, account);
          setEnrichedCampaigns(result);
          
          // Check if we have actual stats
          const hasStats = result.some(c => 
            c.statistics && (c.statistics.subscriber_count > 0 || c.statistics.open_count > 0)
          );
          
          if (hasStats) {
            console.log("Successfully loaded campaign statistics from cache");
            setIsStatsLoaded(true);
            toast.success("Statistiques chargées avec succès", {
              id: "loading-stats",
              duration: 2000
            });
          } else {
            console.log("No statistics found in cache, will try batch loading");
            toast.info("Chargement des statistiques...", {
              id: "loading-stats",
              duration: 3000
            });
          }
        } catch (err) {
          console.error("Error enriching campaigns with statistics:", err);
        }
      } else {
        // If in demo mode, just set the campaigns directly
        if (demoMode) {
          setEnrichedCampaigns(campaigns);
        }
      }
    };
    
    loadStats();
    
    // Nouvelle logique: forcer un rechargement si les statistiques n'ont pas chargé
    if (loadAttempts > 0) {
      // Vérifions si les campagnes ont des statistiques
      const hasStats = campaigns.some(c => 
        c.statistics && (c.statistics.subscriber_count > 0 || c.statistics.open_count > 0)
      );
      
      if (!hasStats) {
        console.log("Les statistiques ne sont pas encore chargées, forçage du rechargement...");
        // Toast pour informer l'utilisateur
        toast.info("Chargement des statistiques...", {
          id: "loading-stats",
          duration: 3000
        });
      }
    }
  }, [campaigns, loadAttempts, account, demoMode]);
  
  // Fonction de rappel appelée lorsque le chargement par lot est terminé
  const handleBatchLoaded = (updatedCampaigns: AcelleCampaign[]) => {
    console.log("Batch loading completed, updating campaigns");
    setEnrichedCampaigns(updatedCampaigns);
    setIsStatsLoaded(true);
    setLoadAttempts(prev => prev + 1);
    
    // Vérifions si les campagnes ont maintenant des statistiques
    const hasStats = updatedCampaigns.some(c => 
      c.statistics && (c.statistics.subscriber_count > 0 || c.statistics.open_count > 0)
    );
    
    if (hasStats) {
      console.log("Les statistiques ont été chargées avec succès");
      toast.success("Statistiques chargées", {
        id: "loading-stats",
        duration: 2000
      });
    } else if (loadAttempts > 0) {
      console.warn("Echec du chargement des statistiques après tentative");
      // Si c'est le deuxième essai, on informe l'utilisateur
      toast.error("Certaines statistiques n'ont pas pu être chargées", {
        id: "loading-stats",
        duration: 3000
      });
    }
  };

  // Use the campaigns with statistics for display
  const campaignsToDisplay = enrichedCampaigns.length > 0 ? enrichedCampaigns : campaigns;

  return (
    <div className="rounded-md border">
      {/* Chargeur par lot des statistiques (invisible) */}
      <AcelleTableBatchLoader 
        campaigns={campaigns} 
        account={account}
        demoMode={demoMode}
        onBatchLoaded={handleBatchLoaded}
      />
      
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
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaignsToDisplay.map((campaign) => (
            <AcelleTableRow 
              key={campaign.uid || campaign.campaign_uid} 
              campaign={campaign} 
              account={account}
              onViewCampaign={onViewCampaign}
              demoMode={demoMode}
              forceReload={loadAttempts > 0}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
