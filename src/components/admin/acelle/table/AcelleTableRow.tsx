
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
import { extractQuickStats } from "@/services/acelle/api/optimizedStats";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";

// Importer les utilitaires qui n'étaient pas correctement importés
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

const renderPercentage = (value: number) => {
  if (isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
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

  // Récupérer les statistiques de la campagne avec le cache
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
        if (result && result.statistics && Object.keys(result.statistics).length > 0) {
          console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`, result.statistics);
          setStats(result.statistics);
          cacheStats(campaignUid, result.statistics);
          
          // Enrichir également la campagne pour faciliter l'accès ultérieur
          campaign.statistics = result.statistics;
          campaign.delivery_info = result.delivery_info;
          
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

  // Utiliser les statistiques de l'état local ou celles directement de la campagne
  const extractStats = () => {
    console.log(`[TableRow] Extraction des stats pour ${campaignName}`, {
      localStats: stats ? 'oui' : 'non', 
      campaignStats: campaign.statistics ? 'oui' : 'non'
    });
    
    // Si nous avons des stats locales, les utiliser
    if (stats) {
      return extractQuickStats({ ...campaign, statistics: stats });
    }
    
    // Sinon, utiliser directement les stats de la campagne
    if (campaign.statistics) {
      return extractQuickStats(campaign);
    }
    
    // Si nous n'avons pas encore de stats
    return { totalSent: 0, openRate: 0, clickRate: 0, bounceCount: 0 };
  };
  
  // Extraire les statistiques importantes
  const quickStats = extractStats();
  
  // Log des statistiques extraites
  console.log(`[TableRow] Statistiques extraites pour ${campaignName}:`, quickStats);

  const handleViewCampaign = () => {
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
          onClick={handleViewCampaign}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
