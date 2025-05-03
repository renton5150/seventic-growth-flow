
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

    // Vérifier si les statistiques sont déjà présentes
    let hasValidStats = false;
    
    // Vérifier si la campagne a des statistiques valides dans statistics
    if (campaign.statistics && 
        typeof campaign.statistics === 'object' && 
        Object.keys(campaign.statistics).length > 0) {
      
      // Vérifier qu'au moins une valeur est non nulle
      const hasNonZeroValue = Object.values(campaign.statistics).some(val => 
        typeof val === 'number' && val > 0
      );
      
      if (hasNonZeroValue) {
        console.log(`Utilisation des statistiques existantes dans campaign.statistics pour ${campaignName}`, campaign.statistics);
        setStats(campaign.statistics);
        hasValidStats = true;
      }
    }
    
    // Si pas de stats valides dans statistics, vérifier delivery_info
    if (!hasValidStats && campaign.delivery_info && 
        typeof campaign.delivery_info === 'object') {
      
      // Vérifier qu'au moins une valeur est non nulle
      const hasNonZeroValue = Object.values(campaign.delivery_info).some(val => 
        (typeof val === 'number' && val > 0) || 
        (typeof val === 'object' && val && Object.values(val).some(v => typeof v === 'number' && v > 0))
      );
      
      if (hasNonZeroValue || campaign.delivery_info.total > 0 || campaign.delivery_info.delivered > 0) {
        console.log(`Utilisation des statistiques existantes dans campaign.delivery_info pour ${campaignName}`, campaign.delivery_info);
        setStats(campaign.delivery_info);
        hasValidStats = true;
      }
    }
    
    // Si aucune statistique valide n'est présente, récupérer depuis l'API
    if (!hasValidStats && account) {
      const fetchStats = async () => {
        try {
          setIsLoading(true);
          console.log(`Récupération des statistiques pour la campagne ${campaignUid}`);
          
          const freshStats = await getCampaignStatsDirectly(campaign, account, { 
            useFallback: true,
            demoMode 
          });
          
          console.log(`Statistiques récupérées pour ${campaignName}:`, freshStats);
          
          // Utiliser les statistiques les plus complètes
          if (freshStats.statistics && Object.keys(freshStats.statistics).length > 0) {
            setStats(freshStats.statistics);
          } else if (freshStats.delivery_info && Object.keys(freshStats.delivery_info).length > 0) {
            setStats(freshStats.delivery_info);
          } else {
            setStats(freshStats || {});
          }
          
          // Enrichir la campagne avec ces statistiques pour qu'elles soient disponibles dans le détail
          if (freshStats.statistics && Object.keys(freshStats.statistics).length > 0) {
            campaign.statistics = {
              ...campaign.statistics,
              ...freshStats.statistics
            };
          }
          
          if (freshStats.delivery_info && Object.keys(freshStats.delivery_info).length > 0) {
            campaign.delivery_info = {
              ...campaign.delivery_info,
              ...freshStats.delivery_info
            };
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des stats pour ${campaignName}:`, error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchStats();
    }
  }, [campaign, account, campaignName, campaignUid, demoMode]);

  // Extraire les statistiques avec gestion des différentes structures possibles
  const getTotalSent = () => {
    // Fonction améliorée pour extraire de toutes les sources possibles
    if (stats) {
      if (typeof stats.total === 'number') return stats.total;
      if (typeof stats.subscriber_count === 'number') return stats.subscriber_count;
    }
    
    // Vérifier aussi dans les propriétés de la campagne
    if (campaign.statistics) {
      if (typeof campaign.statistics.subscriber_count === 'number') {
        return campaign.statistics.subscriber_count;
      }
      if (typeof campaign.statistics.total === 'number') {
        return campaign.statistics.total;
      }
    }
    
    if (campaign.delivery_info) {
      if (typeof campaign.delivery_info.total === 'number') {
        return campaign.delivery_info.total;
      }
      if (typeof campaign.delivery_info.subscriber_count === 'number') {
        return campaign.delivery_info.subscriber_count;
      }
    }
    
    return extractCampaignStat(campaign, 'subscriber_count') || 0;
  };
  
  // Fonction améliorée pour le taux d'ouverture
  const getOpenRate = () => {
    if (stats) {
      if (typeof stats.unique_open_rate === 'number') return stats.unique_open_rate;
      if (typeof stats.uniq_open_rate === 'number') return stats.uniq_open_rate;
      if (typeof stats.open_rate === 'number') return stats.open_rate;
    }
    
    // Vérifier aussi dans les propriétés de la campagne
    if (campaign.statistics) {
      if (typeof campaign.statistics.unique_open_rate === 'number') return campaign.statistics.unique_open_rate;
      if (typeof campaign.statistics.uniq_open_rate === 'number') return campaign.statistics.uniq_open_rate;
      if (typeof campaign.statistics.open_rate === 'number') return campaign.statistics.open_rate;
    }
    
    if (campaign.delivery_info) {
      if (typeof campaign.delivery_info.unique_open_rate === 'number') return campaign.delivery_info.unique_open_rate;
      if (typeof campaign.delivery_info.uniq_open_rate === 'number') return campaign.delivery_info.uniq_open_rate;
      if (typeof campaign.delivery_info.open_rate === 'number') return campaign.delivery_info.open_rate;
    }
    
    return extractCampaignStat(campaign, 'uniq_open_rate') || 0;
  };
  
  // Fonction améliorée pour le taux de clics
  const getClickRate = () => {
    if (stats && typeof stats.click_rate === 'number') return stats.click_rate;
    
    // Vérifier aussi dans les propriétés de la campagne
    if (campaign.statistics && typeof campaign.statistics.click_rate === 'number') {
      return campaign.statistics.click_rate;
    }
    
    if (campaign.delivery_info && typeof campaign.delivery_info.click_rate === 'number') {
      return campaign.delivery_info.click_rate;
    }
    
    return extractCampaignStat(campaign, 'click_rate') || 0;
  };
  
  // Fonction améliorée pour les bounces
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
    
    // Vérifier aussi dans les propriétés de la campagne
    if (campaign.statistics && typeof campaign.statistics.bounce_count === 'number') {
      return campaign.statistics.bounce_count;
    }
    
    if (campaign.delivery_info) {
      if (campaign.delivery_info.bounced) {
        if (typeof campaign.delivery_info.bounced === 'object' && typeof campaign.delivery_info.bounced.total === 'number')
          return campaign.delivery_info.bounced.total;
        if (typeof campaign.delivery_info.bounced === 'number')
          return campaign.delivery_info.bounced;
      }
      
      if (typeof campaign.delivery_info.bounce_count === 'number') {
        return campaign.delivery_info.bounce_count;
      }
    }
    
    return extractCampaignStat(campaign, 'bounce_count') || 0;
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
      },
      rawStats: stats,
      campaignStatistics: campaign.statistics,
      deliveryInfo: campaign.delivery_info
    });
  }, [campaignName, campaignUid, totalSent, openRate, clickRate, bounceCount, stats, campaign.statistics, campaign.delivery_info]);
  
  const handleViewCampaign = () => {
    // Enrichir la campagne avec les statistiques actuelles si elles existent mais pas dans la campagne
    if (stats && (!campaign.statistics || Object.keys(campaign.statistics).length === 0)) {
      campaign.statistics = {
        subscriber_count: totalSent,
        delivered_count: typeof stats.delivered === 'number' ? stats.delivered : 0,
        delivered_rate: typeof stats.delivery_rate === 'number' ? stats.delivery_rate : 0,
        open_count: typeof stats.opened === 'number' ? stats.opened : 0,
        uniq_open_rate: openRate,
        unique_open_rate: openRate,
        click_count: typeof stats.clicked === 'number' ? stats.clicked : 0,
        click_rate: clickRate,
        bounce_count: bounceCount,
        soft_bounce_count: typeof stats.bounced === 'object' ? (stats.bounced.soft || 0) : 0,
        hard_bounce_count: typeof stats.bounced === 'object' ? (stats.bounced.hard || 0) : 0,
        unsubscribe_count: typeof stats.unsubscribed === 'number' ? stats.unsubscribed : 0,
        abuse_complaint_count: typeof stats.complained === 'number' ? stats.complained : 0
      };
    }
    
    if (stats && (!campaign.delivery_info || Object.keys(campaign.delivery_info).length === 0)) {
      campaign.delivery_info = {
        total: totalSent,
        delivered: typeof stats.delivered === 'number' ? stats.delivered : 0,
        delivery_rate: typeof stats.delivery_rate === 'number' ? stats.delivery_rate : 0,
        opened: typeof stats.opened === 'number' ? stats.opened : 0,
        unique_open_rate: openRate,
        clicked: typeof stats.clicked === 'number' ? stats.clicked : 0,
        click_rate: clickRate,
        bounced: typeof stats.bounced === 'object' ? stats.bounced : { total: bounceCount, soft: 0, hard: 0 },
        unsubscribed: typeof stats.unsubscribed === 'number' ? stats.unsubscribed : 0,
        complained: typeof stats.complained === 'number' ? stats.complained : 0
      };
    }
    
    console.log(`Affichage des détails pour la campagne ${campaignUid}`, { campaign });
    onViewCampaign(campaignUid);
  };

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
          onClick={handleViewCampaign}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
