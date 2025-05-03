
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { 
  translateStatus, 
  getStatusBadgeVariant, 
  renderPercentage, 
  extractCampaignStat,
  generateSimulatedStats
} from "@/utils/acelle/campaignStatusUtils";
import { getCampaignStatsDirectly } from "@/services/acelle/api/directStats";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
}

export const AcelleTableRow = ({ 
  campaign, 
  account, 
  onViewCampaign, 
  demoMode = false 
}: AcelleTableRowProps) => {
  // État local pour les statistiques
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;
  
  // Obtenir l'affichage et le style du statut
  const statusDisplay = translateStatus(campaignStatus);
  const variant = getStatusBadgeVariant(campaignStatus);

  // Récupérer les statistiques de la campagne
  useEffect(() => {
    console.log(`Initialisation des statistiques pour la campagne ${campaignName}`, {
      hasDeliveryInfo: !!campaign.delivery_info,
      hasStatistics: !!campaign.statistics,
      demoMode
    });
    
    // Si demoMode, utiliser des statistiques simulées
    if (demoMode) {
      const simulatedStats = generateSimulatedStats();
      setStats(simulatedStats.delivery_info);
      return;
    }

    // Si la campagne a déjà des statistiques chargées et valides, les utiliser
    if (campaign.statistics && 
        typeof campaign.statistics === 'object' && 
        Object.keys(campaign.statistics).length > 0) {
      console.log(`Utilisation des statistiques existantes dans campaign.statistics pour ${campaignName}`);
      setStats(campaign.statistics);
      return;
    }
    
    if (campaign.delivery_info && 
        typeof campaign.delivery_info === 'object' &&
        (campaign.delivery_info.total > 0 || campaign.delivery_info.delivered > 0)) {
      console.log(`Utilisation des statistiques existantes dans campaign.delivery_info pour ${campaignName}`);
      setStats(campaign.delivery_info);
      return;
    }
    
    // Sinon, tenter de récupérer directement depuis l'API
    const fetchStats = async () => {
      // Ne pas récupérer si aucun compte n'est fourni
      if (!account || !campaign) return;
      
      try {
        setIsLoading(true);
        console.log(`Récupération des statistiques pour la campagne ${campaignUid}`);
        
        const freshStats = await getCampaignStatsDirectly(campaign, account, { 
          useFallback: true,
          demoMode 
        });
        
        console.log(`Statistiques récupérées pour ${campaignName}:`, freshStats);
        
        if (freshStats && (freshStats.delivery_info || freshStats.statistics)) {
          setStats(freshStats.delivery_info || freshStats.statistics || {});
        } else {
          setStats(freshStats || {});
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des stats pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [campaign, account, campaignName, campaignUid, demoMode]);

  // Extraire les statistiques avec gestion des différentes structures possibles
  const getTotalSent = () => {
    if (stats) {
      if (typeof stats.total === 'number') return stats.total;
      if (typeof stats.subscriber_count === 'number') return stats.subscriber_count;
    }
    return extractCampaignStat(campaign, 'subscriber_count');
  };
  
  const getOpenRate = () => {
    if (stats) {
      if (typeof stats.unique_open_rate === 'number') return stats.unique_open_rate;
      if (typeof stats.uniq_open_rate === 'number') return stats.uniq_open_rate;
      if (typeof stats.open_rate === 'number') return stats.open_rate;
    }
    return extractCampaignStat(campaign, 'uniq_open_rate');
  };
  
  const getClickRate = () => {
    if (stats && typeof stats.click_rate === 'number') return stats.click_rate;
    return extractCampaignStat(campaign, 'click_rate');
  };
  
  const getBounceCount = () => {
    if (stats) {
      if (stats.bounced) {
        if (typeof stats.bounced === 'object' && typeof stats.bounced.total === 'number')
          return stats.bounced.total;
        if (typeof stats.bounced === 'number')
          return stats.bounced;
      }
      if (typeof stats.bounce_count === 'number') return stats.bounce_count;
    }
    return extractCampaignStat(campaign, 'bounce_count');
  };

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

  // Valeurs à afficher
  const totalSent = getTotalSent();
  const openRate = getOpenRate();
  const clickRate = getClickRate();
  const bounceCount = getBounceCount();

  // Journaliser les données de la campagne pour le débogage
  useEffect(() => {
    console.debug(`Données finales pour campagne ${campaignName}:`, {
      id: campaignUid,
      hasStats: !!stats,
      statsValues: {
        totalSent,
        openRate,
        clickRate,
        bounceCount
      }
    });
  }, [campaignName, campaignUid, totalSent, openRate, clickRate, bounceCount, stats]);
  
  return (
    <TableRow>
      <TableCell className="font-medium">{campaignName}</TableCell>
      <TableCell>{campaignSubject}</TableCell>
      <TableCell>
        <Badge variant={variant}>{statusDisplay}</Badge>
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
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onViewCampaign(campaignUid)}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
