
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus } from "@/utils/acelle/campaignStats";
import { useCampaignStatsCache } from "@/hooks/acelle/useCampaignStatsCache";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";

// Fonction utilitaire pour les badges de statut
const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "new":
      return "secondary";
    case "queued":
      return "default";
    case "sending":
      return "warning";
    case "sent":
      return "success";
    case "paused":
      return "outline";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

// Fonction pour l'affichage des pourcentages
const renderPercentage = (value: number) => {
  if (isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
};

// Fonction pour extraire rapidement les statistiques essentielles
const extractQuickStats = (campaign: AcelleCampaign) => {
  console.log(`[extractQuickStats] Extraction pour campagne ${campaign.uid || campaign.campaign_uid || 'unknown'}`, {
    hasStats: !!campaign.statistics,
    hasDeliveryInfo: !!campaign.delivery_info
  });
  
  let totalSent = 0;
  let openRate = 0;
  let clickRate = 0;
  let bounceCount = 0;
  
  // Priorité 1: Utiliser statistics s'ils existent
  if (campaign.statistics) {
    console.log(`[extractQuickStats] Utilisation de subscriber_count: ${campaign.statistics.subscriber_count}`);
    totalSent = typeof campaign.statistics.subscriber_count === 'number' ? campaign.statistics.subscriber_count : 0;
    openRate = typeof campaign.statistics.uniq_open_rate === 'number' ? campaign.statistics.uniq_open_rate : 0;
    clickRate = typeof campaign.statistics.click_rate === 'number' ? campaign.statistics.click_rate : 0;
    bounceCount = typeof campaign.statistics.bounce_count === 'number' ? campaign.statistics.bounce_count : 0;
  } 
  // Priorité 2: Utiliser delivery_info
  else if (campaign.delivery_info) {
    totalSent = typeof campaign.delivery_info.total === 'number' ? campaign.delivery_info.total : 0;
    openRate = typeof campaign.delivery_info.unique_open_rate === 'number' ? campaign.delivery_info.unique_open_rate : 0;
    clickRate = typeof campaign.delivery_info.click_rate === 'number' ? campaign.delivery_info.click_rate : 0;
    
    if (campaign.delivery_info.bounced) {
      if (typeof campaign.delivery_info.bounced === 'object' && campaign.delivery_info.bounced.total) {
        bounceCount = campaign.delivery_info.bounced.total;
      } else if (typeof campaign.delivery_info.bounced === 'number') {
        bounceCount = campaign.delivery_info.bounced;
      }
    }
  }
  
  console.log(`[extractQuickStats] Résultat pour ${campaign.uid || campaign.campaign_uid || 'unknown'}:`, {
    totalSent, openRate, clickRate, bounceCount
  });
  
  return { totalSent, openRate, clickRate, bounceCount };
};

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
  const [isLoading, setIsLoading] = useState(!stats && !demoMode);
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Log pour le débogage 
  console.log(`[TableRow] Rendu pour campagne ${campaignUid}:`, {
    name: campaign?.name,
    hasStats: !!campaign.statistics,
    statsType: campaign.statistics ? typeof campaign.statistics : 'none'
  });
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques de la campagne
  useEffect(() => {
    if (!campaignUid || demoMode) return;
    
    const loadCampaignStats = async () => {
      try {
        console.log(`[TableRow] Chargement des stats pour ${campaignName} (${campaignUid})`);
        
        // Vérifier si nous avons déjà les statistiques chargées dans l'état local
        if (stats) {
          console.log(`[TableRow] Stats déjà en état local pour ${campaignName}:`, stats);
          // Notifier le parent que les statistiques sont chargées
          if (onStatsLoaded) {
            onStatsLoaded(campaignUid, stats);
          }
          return;
        }
        
        // D'abord vérifier si les statistiques sont déjà présentes dans la campagne
        if (campaign.statistics && Object.keys(campaign.statistics).length > 0) {
          console.log(`[TableRow] Utilisation des statistiques existantes pour ${campaignName}:`, campaign.statistics);
          setStats(campaign.statistics);
          // Mettre à jour le cache avec ces statistiques
          cacheStats(campaignUid, campaign.statistics);
          
          // Notifier le parent que les statistiques sont chargées
          if (onStatsLoaded) {
            onStatsLoaded(campaignUid, campaign.statistics);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Vérifier ensuite dans le cache client
        const cachedStats = getStatsFromCache(campaignUid);
        if (cachedStats) {
          console.log(`[TableRow] Utilisation des statistiques en cache pour ${campaignName}:`, cachedStats);
          setStats(cachedStats);
          
          // Mettre également à jour la campagne pour faciliter l'accès ultérieur
          campaign.statistics = cachedStats;
          
          // Notifier le parent que les statistiques sont chargées
          if (onStatsLoaded) {
            onStatsLoaded(campaignUid, cachedStats);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Si les statistiques ne sont pas en cache, les récupérer
        if (!account) {
          console.warn(`Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        
        // Récupérer et traiter les statistiques
        const result = await fetchAndProcessCampaignStats(campaign, account, { demoMode });
        
        // Vérifier explicitement que les statistiques ne sont pas nulles
        if (result && result.statistics) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, result.statistics);
          setStats(result.statistics);
          cacheStats(campaignUid, result.statistics);
          
          // Enrichir également la campagne pour faciliter l'accès ultérieur
          campaign.statistics = result.statistics;
          
          // Notifier le parent que les statistiques sont chargées
          if (onStatsLoaded) {
            onStatsLoaded(campaignUid, result.statistics);
          }
        } else {
          console.error(`Statistiques invalides reçues pour ${campaignName}`);
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

  // Extraire les statistiques importantes
  const quickStats = extractQuickStats(campaign);
  
  // Log des statistiques extraites
  console.log(`[TableRow] Statistiques extraites pour ${campaignName}:`, quickStats);

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
        {isLoading ? "..." : quickStats.totalSent.toLocaleString()}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(quickStats.openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : renderPercentage(quickStats.clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {isLoading ? "..." : quickStats.bounceCount.toLocaleString()}
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
