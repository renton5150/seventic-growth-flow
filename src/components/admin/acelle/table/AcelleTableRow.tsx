
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";

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
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques de la campagne
  useEffect(() => {
    const loadCampaignStats = async () => {
      console.log(`[TableRow] Initialisation des statistiques pour la campagne ${campaignName}`, {
        hasDeliveryInfo: !!campaign.delivery_info,
        hasStatistics: !!campaign.statistics,
        account: account ? {
          hasToken: !!account.api_token,
          hasEndpoint: !!account.api_endpoint
        } : 'No account'
      });
      
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Utiliser le service pour récupérer les statistiques avec cache intelligent
        const result = await fetchAndProcessCampaignStats(campaign, account!, { 
          refresh: false // Utiliser le cache si disponible et frais
        });
        
        console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, result);
        
        // Mettre à jour l'état local avec les statistiques récupérées
        setStats(result.statistics);
        
        // Enrichir également la campagne avec les statistiques pour qu'elles soient disponibles dans le détail
        campaign.statistics = result.statistics;
        campaign.delivery_info = result.delivery_info;
        
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName]);

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

  // Récupérer les statistiques formattées
  const getTotalSent = (): number => {
    if (stats?.subscriber_count) return stats.subscriber_count;
    if (campaign.statistics?.subscriber_count) return campaign.statistics.subscriber_count;
    if (campaign.delivery_info?.total) return campaign.delivery_info.total;
    return 0;
  };

  const getOpenRate = (): number => {
    if (stats?.uniq_open_rate) return stats.uniq_open_rate;
    if (stats?.open_rate) return stats.open_rate;
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

  // Journaliser les données de la campagne pour le débogage
  useEffect(() => {
    console.debug(`[TableRow] Données finales pour campagne ${campaignName}:`, {
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
    console.log(`[TableRow] Affichage des détails pour la campagne ${campaignUid}`, { campaign });
    onViewCampaign(campaignUid);
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
