
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
    // Si demoMode, utiliser des statistiques simulées
    if (demoMode) {
      const simulatedStats = generateSimulatedStats();
      setStats(simulatedStats);
      return;
    }

    // Si la campagne a déjà des statistiques chargées, les utiliser
    if (campaign.delivery_info && 
        (campaign.delivery_info.total > 0 || campaign.delivery_info.delivered > 0)) {
      setStats(campaign.delivery_info);
      return;
    }
    
    // Sinon, tenter de récupérer directement depuis l'API
    const fetchStats = async () => {
      // Ne pas récupérer si aucun compte n'est fourni
      if (!account || !campaign) return;
      
      try {
        setIsLoading(true);
        const freshStats = await getCampaignStatsDirectly(campaign, account, { 
          useFallback: true,
          demoMode 
        });
        setStats(freshStats.delivery_info || freshStats);
      } catch (error) {
        console.error(`Erreur lors de la récupération des stats pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [campaign, account, campaignName, demoMode]);

  // Récupération des statistiques
  const totalSent = stats ? 
    (stats.total || 0) : 
    extractCampaignStat(campaign, 'subscriber_count');
    
  const openRate = stats ? 
    (stats.unique_open_rate || 0) : 
    extractCampaignStat(campaign, 'uniq_open_rate');
    
  const clickRate = stats ? 
    (stats.click_rate || 0) : 
    extractCampaignStat(campaign, 'click_rate');
    
  const bounceCount = stats && stats.bounced ? 
    (typeof stats.bounced === 'object' ? (stats.bounced.total || 0) : stats.bounced) :
    extractCampaignStat(campaign, 'bounce_count');

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

  // Journaliser les données de la campagne pour le débogage
  useEffect(() => {
    console.debug(`Données pour campagne ${campaignName}:`, {
      id: campaignUid,
      hasStats: !!stats,
      stats: {
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
