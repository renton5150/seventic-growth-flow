
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage, formatNumberSafely } from "@/utils/acelle/campaignStatusUtils";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/stats/campaignStats";

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
        deliveryInfo: campaign.delivery_info ? {
          openRate: campaign.delivery_info.uniq_open_rate || campaign.delivery_info.open_rate || 'Non défini',
          clickRate: campaign.delivery_info.click_rate || 'Non défini'
        } : 'No delivery_info',
        statistics: campaign.statistics ? {
          openRate: campaign.statistics.uniq_open_rate || campaign.statistics.open_rate || 'Non défini',
          clickRate: campaign.statistics.click_rate || 'Non défini'
        } : 'No statistics',
        account: account ? {
          hasToken: !!account.api_token,
          hasEndpoint: !!account.api_endpoint
        } : 'No account'
      });
      
      // Si nous avons déjà toutes les statistiques nécessaires, pas besoin de recharger
      if (campaign.delivery_info && 
          (campaign.delivery_info.uniq_open_rate > 0 || 
           campaign.delivery_info.open_rate > 0 ||
           campaign.delivery_info.unique_open_rate > 0) && 
          campaign.delivery_info.click_rate > 0) {
        console.log(`[TableRow] Statistiques déjà disponibles pour ${campaignName}, aucun chargement supplémentaire nécessaire`);
        setStats(campaign.delivery_info as AcelleCampaignStatistics);
        return;
      }
      
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Utiliser le service pour récupérer les statistiques avec cache intelligent
        const enrichedCampaign = await fetchAndProcessCampaignStats(campaign, account, { 
          refresh: false // Utiliser le cache si disponible et frais
        }) as AcelleCampaign;
        
        console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, {
          hasStatistics: !!enrichedCampaign.statistics,
          openRate: enrichedCampaign.statistics?.uniq_open_rate || 
                    enrichedCampaign.statistics?.open_rate || 
                    'Non défini',
          clickRate: enrichedCampaign.statistics?.click_rate || 'Non défini',
          rawStats: enrichedCampaign.statistics
        });
        
        // Mettre à jour l'état local avec les statistiques récupérées
        if (enrichedCampaign && enrichedCampaign.statistics) {
          setStats(enrichedCampaign.statistics);
          
          // Enrichir également la campagne avec les statistiques pour qu'elles soient disponibles dans le détail
          campaign.statistics = enrichedCampaign.statistics;
          campaign.delivery_info = enrichedCampaign.delivery_info;
        } else {
          console.warn(`[TableRow] Pas de statistiques disponibles pour ${campaignName}`);
        }
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

  // GETTERS AMÉLIORÉS pour extraire les statistiques de façon plus robuste
  const getTotalSent = (): number => {
    let value = 0;
    
    // Essayer plusieurs chemins possibles pour obtenir cette valeur
    if (stats?.subscriber_count) {
      value = parseFloat(String(stats.subscriber_count));
    } else if (campaign.statistics?.subscriber_count) {
      value = parseFloat(String(campaign.statistics.subscriber_count));
    } else if (campaign.delivery_info?.total) {
      value = parseFloat(String(campaign.delivery_info.total));
    } else if (campaign.delivery_info?.subscriber_count) {
      value = parseFloat(String(campaign.delivery_info.subscriber_count));
    }
    
    return isNaN(value) ? 0 : value;
  };

  const getOpenRate = (): number => {
    let value = 0;
    
    // Essayer plusieurs chemins possibles pour obtenir le taux d'ouverture
    if (stats?.uniq_open_rate !== undefined) {
      value = parseFloat(String(stats.uniq_open_rate));
    } else if (stats?.open_rate !== undefined) {
      value = parseFloat(String(stats.open_rate));
    } else if (campaign.statistics?.uniq_open_rate !== undefined) {
      value = parseFloat(String(campaign.statistics.uniq_open_rate));
    } else if (campaign.statistics?.open_rate !== undefined) {
      value = parseFloat(String(campaign.statistics.open_rate));
    } else if (campaign.delivery_info?.unique_open_rate !== undefined) {
      value = parseFloat(String(campaign.delivery_info.unique_open_rate));
    } else if (campaign.delivery_info?.uniq_open_rate !== undefined) {
      value = parseFloat(String(campaign.delivery_info.uniq_open_rate));
    } else if (campaign.delivery_info?.open_rate !== undefined) {
      value = parseFloat(String(campaign.delivery_info.open_rate));
    }
    
    // Déboguer les valeurs
    console.log(`[TableRow] Taux d'ouverture pour ${campaignName}:`, {
      value,
      statsValue: stats?.uniq_open_rate,
      campaignValue: campaign.statistics?.uniq_open_rate,
      deliveryInfoValue: campaign.delivery_info?.uniq_open_rate
    });
    
    return isNaN(value) ? 0 : value;
  };

  const getClickRate = (): number => {
    let value = 0;
    
    // Essayer plusieurs chemins possibles
    if (stats?.click_rate !== undefined) {
      value = parseFloat(String(stats.click_rate));
    } else if (campaign.statistics?.click_rate !== undefined) {
      value = parseFloat(String(campaign.statistics.click_rate));
    } else if (campaign.delivery_info?.click_rate !== undefined) {
      value = parseFloat(String(campaign.delivery_info.click_rate));
    }
    
    // Déboguer les valeurs
    console.log(`[TableRow] Taux de clic pour ${campaignName}:`, {
      value,
      statsValue: stats?.click_rate,
      campaignValue: campaign.statistics?.click_rate,
      deliveryInfoValue: campaign.delivery_info?.click_rate
    });
    
    return isNaN(value) ? 0 : value;
  };

  const getBounceCount = (): number => {
    let value = 0;
    
    // Essayer plusieurs chemins possibles
    if (stats?.bounce_count !== undefined) {
      value = parseFloat(String(stats.bounce_count));
    } else if (campaign.statistics?.bounce_count !== undefined) {
      value = parseFloat(String(campaign.statistics.bounce_count));
    } else if (campaign.delivery_info?.bounced) {
      if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced.total) {
        value = parseFloat(String(campaign.delivery_info.bounced.total));
      } else if (typeof campaign.delivery_info.bounced === 'number' || typeof campaign.delivery_info.bounced === 'string') {
        value = parseFloat(String(campaign.delivery_info.bounced));
      }
    } else if (campaign.delivery_info?.bounce_count !== undefined) {
      value = parseFloat(String(campaign.delivery_info.bounce_count));
    }
    
    return isNaN(value) ? 0 : value;
  };

  // Valeurs à afficher
  const totalSent = getTotalSent();
  const openRate = getOpenRate();
  const clickRate = getClickRate();
  const bounceCount = getBounceCount();

  // Journaliser les données de la campagne pour le débogage
  useEffect(() => {
    console.log(`[TableRow] Données finales pour campagne ${campaignName}:`, {
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
      campaignDeliveryInfo: campaign.delivery_info
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
        {isLoading ? "..." : formatNumberSafely(totalSent)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : formatNumberSafely(bounceCount)}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleViewCampaign}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir
        </Button>
      </TableCell>
    </TableRow>
  );
};
