import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
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
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(
    campaign.statistics || null
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques de la campagne uniquement si nécessaire
  useEffect(() => {
    const loadCampaignStats = async () => {
      // Vérifier si nous avons déjà des statistiques valides
      const hasValidStats = stats && 
                           stats.subscriber_count > 0 && 
                           (stats.delivered_count > 0 || stats.delivered_rate >= 0);
      
      // Si nous avons déjà des statistiques valides ou que la campagne a déjà des statistiques, ne pas recharger
      if (hasValidStats || (campaign.statistics && campaign.statistics.subscriber_count > 0)) {
        console.log(`[TableRow] Campagne ${campaignName} a déjà des statistiques valides, pas de rechargement nécessaire`);
        if (!stats && campaign.statistics) {
          setStats(campaign.statistics);
        }
        return;
      }
      
      // Vérifier si nous avons un compte pour récupérer les statistiques
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        console.log(`[TableRow] Chargement des statistiques pour la campagne ${campaignName}`);
        
        // Utiliser le service pour récupérer les statistiques avec cache intelligent - sans forcer le refresh
        const enrichedCampaign = await fetchAndProcessCampaignStats(campaign, account, { 
          refresh: false // Utiliser le cache si disponible et frais
        }) as AcelleCampaign;
        
        console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, 
          enrichedCampaign.statistics || 'Aucune statistique disponible');
        
        // Mettre à jour l'état local avec les statistiques récupérées
        if (enrichedCampaign && enrichedCampaign.statistics) {
          setStats(enrichedCampaign.statistics);
          
          // Enrichir également la campagne avec les statistiques pour qu'elles soient disponibles dans le détail
          campaign.statistics = enrichedCampaign.statistics;
          campaign.delivery_info = enrichedCampaign.delivery_info;
        }
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, stats]);

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

  // Journal des données pour debugging
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
