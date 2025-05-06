
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { fetchDirectStatistics } from "@/services/acelle/api/stats/directStats";
import { getLastUpdatedTimestamp } from "@/services/acelle/api/stats/cacheManager";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ 
  campaign, 
  account, 
  onViewCampaign
}: AcelleTableRowProps) => {
  // État local pour les statistiques
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(
    campaign.statistics || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer le timestamp du dernier refresh
  useEffect(() => {
    const fetchLastUpdated = async () => {
      if (!campaignUid || !account?.id) return;
      
      try {
        const timestamp = await getLastUpdatedTimestamp(campaignUid, account.id);
        setLastUpdated(timestamp);
      } catch (error) {
        console.error("[TableRow] Erreur lors de la récupération du timestamp:", error);
      }
    };
    
    fetchLastUpdated();
  }, [campaignUid, account?.id, stats]);

  // Récupérer les statistiques de la campagne uniquement si nécessaire
  useEffect(() => {
    const loadCampaignStats = async () => {
      // S'il n'y a pas de compte ou d'UID de campagne, on ne peut pas charger les statistiques
      if (!account || !campaignUid) {
        console.warn(`[TableRow] Pas de compte ou d'UID disponible pour ${campaignName}`);
        return;
      }
      
      // Si nous avons déjà des statistiques valides en état local et que nous ne sommes pas en train
      // de rafraîchir, ne pas recharger
      if (stats && stats.subscriber_count > 0 && !isRefreshing) {
        return;
      }

      // Si les statistiques de la campagne semblent valides et que nous ne sommes pas en train
      // de rafraîchir, les utiliser
      if (!isRefreshing && campaign.statistics && campaign.statistics.subscriber_count > 0) {
        setStats(campaign.statistics);
        return;
      }
      
      try {
        setIsLoading(true);
        
        console.log(`[TableRow] Chargement des statistiques pour la campagne ${campaignName}`);
        
        // Toujours forcer le rafraîchissement pour obtenir les données depuis l'API
        const apiStats = await fetchDirectStatistics(campaignUid, account, { 
          forceRefresh: true // Forcer le rafraîchissement pour obtenir les données depuis l'API
        });
        
        if (apiStats) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, apiStats);
          
          // Mettre à jour l'état local avec les statistiques récupérées
          setStats(apiStats);
          
          // Mettre à jour le timestamp
          const newTimestamp = await getLastUpdatedTimestamp(campaignUid, account.id);
          setLastUpdated(newTimestamp);
          
          // Enrichir également la campagne avec les statistiques pour qu'elles soient disponibles dans le détail
          campaign.statistics = apiStats;
        } else {
          console.warn(`[TableRow] Pas de statistiques API pour ${campaignName}`);
        }
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid, stats, isRefreshing]);

  // Formatage sécurisé des dates
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Récupérer les statistiques formattées avec priorité claire
  const getTotalSent = (): number => {
    // Priorité 1: États locaux
    if (stats?.subscriber_count) return stats.subscriber_count;
    
    // Priorité 2: Données de la campagne
    if (campaign.statistics?.subscriber_count) return campaign.statistics.subscriber_count;
    if (campaign.delivery_info?.total) return campaign.delivery_info.total;
    
    return 0;
  };

  const getOpenRate = (): number => {
    // Priorité aux données les plus spécifiques
    if (stats?.uniq_open_rate) return stats.uniq_open_rate;
    if (stats?.open_rate) return stats.open_rate;
    
    // Fallback aux données de la campagne
    if (campaign.statistics?.uniq_open_rate) return campaign.statistics.uniq_open_rate;
    if (campaign.delivery_info?.unique_open_rate) return campaign.delivery_info.unique_open_rate;
    
    return 0;
  };

  const getClickRate = (): number => {
    if (stats?.click_rate) return stats.click_rate;
    if (campaign.statistics?.click_rate) return campaign.statistics.click_rate;
    if (campaign.delivery_info?.click_rate) return campaign.delivery_info.click_rate;
    return 0;
  };

  const getBounceCount = (): number => {
    if (stats?.bounce_count) return stats.bounce_count;
    if (campaign.statistics?.bounce_count) return campaign.statistics.bounce_count;
    
    if (campaign.delivery_info?.bounced) {
      if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced.total) {
        return campaign.delivery_info.bounced.total;
      }
      if (typeof campaign.delivery_info.bounced === 'number') {
        return campaign.delivery_info.bounced;
      }
    }
    
    return 0;
  };

  // Valeurs à afficher
  const totalSent = getTotalSent();
  const openRate = getOpenRate();
  const clickRate = getClickRate();
  const bounceCount = getBounceCount();
  
  const handleViewCampaign = () => {
    console.log(`[TableRow] Affichage des détails pour la campagne ${campaignUid}`, { campaign });
    onViewCampaign(campaignUid);
  };

  const handleRefreshStats = async () => {
    if (!account || !campaignUid) return;
    
    setIsRefreshing(true);
    // Le useEffect se déclenchera pour recharger les statistiques
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{campaignName}</TableCell>
      <TableCell>{campaignSubject}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaignStatus)}>
          {translateStatus(campaignStatus)}
        </Badge>
      </TableCell>
      <TableCell>{formatDateSafely(deliveryDate)}</TableCell>
      <TableCell className="font-medium tabular-nums">
        {isLoading ? "..." : totalSent.toLocaleString()}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : bounceCount.toLocaleString()}
      </TableCell>
      <TableCell>
        {lastUpdated ? formatDateSafely(lastUpdated) : "Jamais"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleViewCampaign}
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
