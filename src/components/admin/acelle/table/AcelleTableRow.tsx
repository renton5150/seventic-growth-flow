
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { fetchDirectStatistics, hasEmptyStatistics } from "@/services/acelle/api/stats/directStats";
import { toast } from "sonner";

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
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(campaign?.statistics || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques de la campagne directement depuis l'API
  useEffect(() => {
    const loadCampaignStats = async () => {
      // Réinitialiser l'état d'erreur
      setLoadError(null);
      
      // Si les statistiques sont déjà présentes avec des valeurs non-nulles, ne pas recharger
      if (campaign.statistics && !hasEmptyStatistics(campaign.statistics) && !campaign.meta?.force_refresh) {
        console.log(`[TableRow] Statistiques déjà présentes pour la campagne ${campaignName}`, campaign.statistics);
        setStats(campaign.statistics);
        return;
      }
      
      console.log(`[TableRow] Récupération des statistiques pour la campagne ${campaignName}`);
      
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        setLoadError("Compte non disponible");
        return;
      }
      
      if (!campaignUid) {
        console.warn(`[TableRow] Pas d'UID pour la campagne ${campaignName}`);
        setLoadError("UID de campagne manquant");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Récupérer les statistiques directement depuis l'API
        const freshStats = await fetchDirectStatistics(campaignUid, account);
        
        if (freshStats) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}`, freshStats);
          setStats(freshStats);
        } else {
          console.log(`[TableRow] Pas de statistiques disponibles pour ${campaignName}`);
          // Utiliser les statistiques existantes si disponibles, ou extraire de delivery_info
          if (campaign.statistics && !hasEmptyStatistics(campaign.statistics)) {
            setStats(campaign.statistics);
          } else if (campaign.delivery_info) {
            // Tenter d'extraire les données depuis delivery_info
            const extractedStats: AcelleCampaignStatistics = {
              subscriber_count: campaign.delivery_info.total || 0,
              delivered_count: campaign.delivery_info.delivered || 0,
              delivered_rate: campaign.delivery_info.delivery_rate || 0,
              open_count: campaign.delivery_info.opened || 0,
              uniq_open_count: campaign.delivery_info.opened || 0, // Utiliser "opened" comme fallback
              uniq_open_rate: campaign.delivery_info.unique_open_rate || 0,
              click_count: campaign.delivery_info.clicked || 0,
              click_rate: campaign.delivery_info.click_rate || 0,
              bounce_count: typeof campaign.delivery_info.bounced === 'object' 
                ? campaign.delivery_info.bounced.total 
                : (campaign.delivery_info.bounced || 0),
              soft_bounce_count: typeof campaign.delivery_info.bounced === 'object'
                ? campaign.delivery_info.bounced.soft
                : 0,
              hard_bounce_count: typeof campaign.delivery_info.bounced === 'object'
                ? campaign.delivery_info.bounced.hard
                : 0,
              unsubscribe_count: campaign.delivery_info.unsubscribed || 0,
              abuse_complaint_count: campaign.delivery_info.complained || 0
            };
            setStats(extractedStats);
          } else {
            setLoadError("Aucune statistique disponible");
          }
        }
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
        setLoadError("Erreur de récupération");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid]);

  // Fonction pour forcer le rafraîchissement des statistiques
  const handleRefreshStats = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de déclencher l'événement sur la ligne
    
    if (!account || isLoading) return;
    
    try {
      setIsLoading(true);
      setLoadError(null);
      toast.loading(`Rafraîchissement des statistiques pour ${campaignName}...`);
      
      const freshStats = await fetchDirectStatistics(campaignUid, account);
      
      if (freshStats) {
        setStats(freshStats);
        toast.success(`Statistiques mises à jour pour ${campaignName}`);
      } else {
        toast.error(`Échec de la mise à jour des statistiques pour ${campaignName}`);
        setLoadError("Échec du rafraîchissement");
      }
    } catch (error) {
      console.error(`Erreur lors du rafraîchissement des statistiques:`, error);
      toast.error(`Erreur lors du rafraîchissement des statistiques`);
      setLoadError("Erreur de rafraîchissement");
    } finally {
      setIsLoading(false);
    }
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

  // Récupérer les valeurs prioritaires avec plus de logs pour déboguer
  const getValueWithFallbacks = (
    mainValue?: number | null, 
    fallbacks: Array<number | undefined | null> = []
  ): number => {
    if (mainValue !== undefined && mainValue !== null) {
      console.log(`[TableRow] Utilisation de la valeur principale: ${mainValue}`);
      return mainValue;
    }
    
    for (const [index, fallback] of fallbacks.entries()) {
      if (fallback !== undefined && fallback !== null) {
        console.log(`[TableRow] Utilisation de la valeur de fallback ${index}: ${fallback}`);
        return fallback;
      }
    }
    
    console.log(`[TableRow] Aucune valeur trouvée, utilisation de 0 par défaut`);
    return 0;
  };

  // Récupérer les statistiques avec priorités et logging pour déboguer
  const getTotalSent = (): number => {
    console.log(`[TableRow:${campaignName}] Données pour total envois:`, {
      stats_subscriber_count: stats?.subscriber_count,
      campaign_stats_subscriber_count: campaign.statistics?.subscriber_count,
      delivery_info_total: campaign.delivery_info?.total
    });
    
    return getValueWithFallbacks(
      stats?.subscriber_count,
      [
        campaign.statistics?.subscriber_count,
        campaign.delivery_info?.total
      ]
    );
  };

  const getOpenRate = (): number => {
    console.log(`[TableRow:${campaignName}] Données pour taux d'ouverture:`, {
      stats_uniq_open_rate: stats?.uniq_open_rate,
      stats_open_rate: stats?.open_rate,
      campaign_stats_uniq_open_rate: campaign.statistics?.uniq_open_rate,
      delivery_info_unique_open_rate: campaign.delivery_info?.unique_open_rate
    });
    
    return getValueWithFallbacks(
      stats?.uniq_open_rate,
      [
        stats?.open_rate,
        campaign.statistics?.uniq_open_rate,
        campaign.delivery_info?.unique_open_rate
      ]
    );
  };

  const getClickRate = (): number => {
    console.log(`[TableRow:${campaignName}] Données pour taux de clic:`, {
      stats_click_rate: stats?.click_rate,
      campaign_stats_click_rate: campaign.statistics?.click_rate,
      delivery_info_click_rate: campaign.delivery_info?.click_rate
    });
    
    return getValueWithFallbacks(
      stats?.click_rate,
      [
        campaign.statistics?.click_rate,
        campaign.delivery_info?.click_rate
      ]
    );
  };

  const getBounceCount = (): number => {
    console.log(`[TableRow:${campaignName}] Données pour bounces:`, {
      stats_bounce_count: stats?.bounce_count,
      campaign_stats_bounce_count: campaign.statistics?.bounce_count,
      delivery_info_bounced: campaign.delivery_info?.bounced
    });
    
    return getValueWithFallbacks(
      stats?.bounce_count,
      [
        campaign.statistics?.bounce_count,
        typeof campaign.delivery_info?.bounced === 'object' 
          ? campaign.delivery_info?.bounced?.total 
          : campaign.delivery_info?.bounced
      ]
    );
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
      <TableCell className="text-right flex gap-1">
        <Button 
          variant={loadError ? "destructive" : "ghost"}
          size="icon"
          onClick={handleRefreshStats}
          disabled={isLoading}
          title={loadError || "Rafraîchir les statistiques"}
        >
          {loadError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          )}
        </Button>
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
