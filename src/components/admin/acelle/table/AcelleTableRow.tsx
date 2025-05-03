
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";
import { useCampaignStatsCache } from "@/hooks/acelle/useCampaignStatsCache";
import { extractQuickStats } from "@/services/acelle/api/optimizedStats";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
  onStatsLoaded?: (uid: string, stats: AcelleCampaignStatistics) => void;
}

export const AcelleTableRow = ({ 
  campaign, 
  account, 
  onViewCampaign, 
  demoMode = false,
  onStatsLoaded 
}: AcelleTableRowProps) => {
  // Utiliser le cache des statistiques
  const { getStatsFromCache, cacheStats } = useCampaignStatsCache();
  
  // État local pour les statistiques
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(
    campaign.statistics && Object.keys(campaign.statistics).length > 0 
      ? campaign.statistics 
      : null
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

  // Récupérer les statistiques de la campagne avec le cache
  useEffect(() => {
    const loadCampaignStats = async () => {
      if (!campaignUid) return;
      
      // Vérifier si nous avons déjà les statistiques chargées dans l'état local
      if (stats) {
        // Notifier le parent que les statistiques sont chargées
        if (onStatsLoaded) {
          onStatsLoaded(campaignUid, stats);
        }
        return;
      }
      
      // D'abord vérifier si les statistiques sont déjà présentes dans la campagne
      if (campaign.statistics && Object.keys(campaign.statistics).length > 0) {
        console.log(`[TableRow] Utilisation des statistiques existantes pour ${campaignName}`);
        setStats(campaign.statistics);
        // Mettre à jour le cache avec ces statistiques
        cacheStats(campaignUid, campaign.statistics);
        
        // Notifier le parent que les statistiques sont chargées
        if (onStatsLoaded) {
          onStatsLoaded(campaignUid, campaign.statistics);
        }
        
        return;
      }
      
      // Vérifier ensuite dans le cache client
      const cachedStats = getStatsFromCache(campaignUid);
      if (cachedStats) {
        console.log(`[TableRow] Utilisation des statistiques en cache pour ${campaignName}`);
        setStats(cachedStats);
        
        // Mettre également à jour la campagne pour faciliter l'accès ultérieur
        campaign.statistics = cachedStats;
        
        // Notifier le parent que les statistiques sont chargées
        if (onStatsLoaded) {
          onStatsLoaded(campaignUid, cachedStats);
        }
        
        return;
      }
      
      // Si les statistiques ne sont pas en cache, les récupérer
      if (!account && !demoMode) {
        console.warn(`Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Récupérer et traiter les statistiques
        const result = await fetchAndProcessCampaignStats(campaign, account!, { demoMode });
        
        // Mettre à jour l'état et le cache avec les statistiques
        if (result.statistics) {
          setStats(result.statistics);
          cacheStats(campaignUid, result.statistics);
          
          // Enrichir également la campagne pour faciliter l'accès ultérieur
          campaign.statistics = result.statistics;
          campaign.delivery_info = result.delivery_info;
          
          // Notifier le parent que les statistiques sont chargées
          if (onStatsLoaded) {
            onStatsLoaded(campaignUid, result.statistics);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignStats();
  }, [campaign, account, campaignName, campaignUid, demoMode, cacheStats, getStatsFromCache, onStatsLoaded, stats]);

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

  // Utiliser les statistiques de l'état local ou celles de la campagne
  const currentStats = stats || campaign.statistics;
  
  // Extraire les statistiques importantes
  const { totalSent, openRate, clickRate, bounceCount } = currentStats 
    ? extractQuickStats({ ...campaign, statistics: currentStats })
    : { totalSent: 0, openRate: 0, clickRate: 0, bounceCount: 0 };

  const handleViewCampaign = () => {
    console.log(`Affichage des détails pour la campagne ${campaignUid}`, { campaign });
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
