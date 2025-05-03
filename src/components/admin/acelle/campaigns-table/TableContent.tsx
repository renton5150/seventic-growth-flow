
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
import { Button } from "@/components/ui/button"; 
import { RefreshCw, AlertTriangle } from "lucide-react"; 
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { fetchStatsBatch, refreshAllCampaignStats } from "@/services/acelle/api/directFetch";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrichedCampaigns, setEnrichedCampaigns] = useState<AcelleCampaign[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Chargement des statistiques...");

  // Effet pour charger les statistiques
  useEffect(() => {
    if (!campaigns.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingMessage("Chargement des statistiques...");
    
    const loadStats = async () => {
      try {
        // Si en mode démo, utiliser directement les campagnes
        if (demoMode) {
          setEnrichedCampaigns(campaigns);
          setIsLoading(false);
          return;
        }
        
        // Si pas de compte actif, ne rien charger
        if (!account) {
          setErrorMessage("Aucun compte Acelle actif");
          setIsLoading(false);
          return;
        }
        
        toast.loading("Chargement des statistiques...", { id: "load-stats" });
        
        // Utiliser la nouvelle fonction directe pour récupérer les statistiques
        const enrichedData = await fetchStatsBatch(campaigns, account);
        setEnrichedCampaigns(enrichedData);
        
        // Vérifier si nous avons des données non-nulles
        const hasValidStats = enrichedData.some(campaign => 
          campaign.statistics && (
            campaign.statistics.subscriber_count > 0 || 
            campaign.statistics.open_count > 0
          )
        );
        
        if (hasValidStats) {
          toast.success("Statistiques chargées avec succès", { id: "load-stats" });
        } else {
          toast.info("Statistiques chargées (certaines données peuvent être estimées)", { id: "load-stats" });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        setErrorMessage("Erreur lors du chargement des statistiques");
        toast.error("Erreur lors du chargement des statistiques", { id: "load-stats" });
        
        // En cas d'erreur, utiliser les campagnes brutes
        setEnrichedCampaigns(campaigns);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [campaigns, account, demoMode]);

  // Fonction pour rafraîchir manuellement les statistiques
  const handleRefreshStats = async () => {
    if (!account || demoMode || isRefreshing) return;
    
    setIsRefreshing(true);
    setErrorMessage(null);
    
    try {
      // Appel à la nouvelle fonction de rafraîchissement direct
      const success = await refreshAllCampaignStats(account);
      
      if (success) {
        // Recharger les statistiques
        const refreshedData = await fetchStatsBatch(campaigns, account);
        setEnrichedCampaigns(refreshedData);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des statistiques:", error);
      setErrorMessage("Erreur lors du rafraîchissement des statistiques");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Afficher un état de chargement
  if (isLoading && !demoMode) {
    return (
      <div className="rounded-md border p-8 flex flex-col items-center justify-center">
        <Spinner className="w-8 h-8 mb-4" />
        <p className="text-center text-gray-500">
          {loadingMessage}
        </p>
      </div>
    );
  }

  // Utiliser les campagnes enrichies si disponibles, sinon les campagnes brutes
  const campaignsToDisplay = enrichedCampaigns.length > 0 ? enrichedCampaigns : campaigns;

  return (
    <div className="space-y-4">
      {/* Bouton de rafraîchissement des statistiques */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshStats}
          disabled={isRefreshing || demoMode}
          className="mb-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Rafraîchissement..." : "Rafraîchir les statistiques"}
        </Button>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          <span>{errorMessage}</span>
        </div>
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
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
