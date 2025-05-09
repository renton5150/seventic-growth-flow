
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { fetchDirectStatistics } from "@/services/acelle/api/stats/directStats";

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

  // Récupérer les statistiques de la campagne directement depuis l'API
  useEffect(() => {
    const loadCampaignStats = async () => {
      console.log(`[TableRow] Récupération des statistiques pour la campagne ${campaignName}`);
      
      if (!account) {
        console.warn(`[TableRow] Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        return;
      }
      
      if (!campaignUid) {
        console.warn(`[TableRow] Pas d'UID pour la campagne ${campaignName}`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Récupérer les statistiques directement depuis l'API
        const freshStats = await fetchDirectStatistics(campaignUid, account);
        
        if (freshStats) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}`, freshStats);
          setStats(freshStats);
        } else {
          console.log(`[TableRow] Aucune statistique disponible pour ${campaignName}`);
          // Utiliser les statistiques existantes si disponibles
          if (campaign.statistics) {
            setStats(campaign.statistics);
          }
        }
      } catch (error) {
        console.error(`[TableRow] Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid]);

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

  // Récupérer les valeurs prioritaires
  const getValueWithFallbacks = (
    mainValue?: number | null, 
    fallbacks: Array<number | undefined | null> = []
  ): number => {
    if (mainValue !== undefined && mainValue !== null) return mainValue;
    
    for (const fallback of fallbacks) {
      if (fallback !== undefined && fallback !== null) {
        return fallback;
      }
    }
    
    return 0;
  };

  // Récupérer les statistiques avec priorités
  const getTotalSent = (): number => {
    return getValueWithFallbacks(
      stats?.subscriber_count,
      [
        campaign.statistics?.subscriber_count,
        campaign.delivery_info?.total
      ]
    );
  };

  const getOpenRate = (): number => {
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
    return getValueWithFallbacks(
      stats?.click_rate,
      [
        campaign.statistics?.click_rate,
        campaign.delivery_info?.click_rate
      ]
    );
  };

  const getBounceCount = (): number => {
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
