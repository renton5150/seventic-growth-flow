
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
import { extractQuickStats, getCachedStats, cacheStats } from "@/services/acelle/api/optimizedStats";

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

  // Initialiser directement avec les statistiques existantes si disponibles
  useEffect(() => {
    initializeStats();
  }, [campaign]);

  // Fonction pour initialiser les statistiques
  const initializeStats = () => {
    // On tente d'abord d'obtenir des statistiques existantes
    if (campaign?.statistics) {
      console.log(`Utilisation des statistiques existantes pour ${campaignName}`);
      setStats(campaign.statistics);
      return;
    }
    
    // Ensuite on vérifie si elles sont en cache
    if (campaignUid) {
      const cachedStats = getCachedStats(campaignUid);
      if (cachedStats) {
        console.log(`Utilisation des statistiques en cache pour ${campaignName}`);
        setStats(cachedStats);
        
        // Enrichir également la campagne avec les statistiques du cache
        campaign.statistics = cachedStats;
        return;
      }
    }

    // Sinon, extraire des données rapides à partir de delivery_info
    if (campaign?.delivery_info) {
      const quickStats = extractQuickStats(campaign);
      console.log(`Utilisation des quickstats pour ${campaignName}`, quickStats);
      setStats(quickStats);
      
      // Mettre en cache ces statistiques rapides
      if (campaignUid) {
        cacheStats(campaignUid, quickStats);
      }
      
      // Enrichir la campagne
      campaign.statistics = quickStats;
      return;
    }
    
    // Si aucune statistique n'est disponible, charger à partir de l'API
    loadCampaignStats();
  };

  // Récupérer les statistiques de la campagne si nécessaire
  const loadCampaignStats = async () => {
    if (!campaignUid) return;
    
    console.log(`Chargement des statistiques pour la campagne ${campaignName}`, {
      hasDeliveryInfo: !!campaign.delivery_info,
      hasStatistics: !!campaign.statistics,
      demoMode
    });
    
    if (!account && !demoMode) {
      console.warn(`Pas de compte disponible pour récupérer les statistiques de ${campaignName}`);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Utiliser le service pour récupérer les statistiques
      const result = await fetchAndProcessCampaignStats(campaign, account!, { 
        demoMode,
        useCache: true
      });
      
      console.log(`Statistiques récupérées pour ${campaignName}:`, result.statistics);
      
      // Mettre à jour l'état local avec les statistiques récupérées
      setStats(result.statistics);
      
      // Enrichir également la campagne avec les statistiques pour qu'elles soient disponibles dans le détail
      campaign.statistics = result.statistics;
      
      // Assigner les delivery_info s'ils n'existent pas encore
      if (!campaign.delivery_info && result.delivery_info) {
        campaign.delivery_info = result.delivery_info;
      }
      
      // Mettre en cache les statistiques récupérées
      if (campaignUid) {
        cacheStats(campaignUid, result.statistics);
      }
      
      console.log(`Statistiques chargées avec succès pour ${campaignName}:`, result.statistics);
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques pour ${campaignName}:`, error);
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

  // Méthodes pour récupérer les statistiques avec priorité et fallback
  const getTotalSent = (): number => {
    // Si les statistiques ont été chargées dans l'état local
    if (stats?.subscriber_count !== undefined) {
      return stats.subscriber_count;
    }
    
    // Utiliser les stats de la campagne si disponibles
    if (campaign.statistics?.subscriber_count !== undefined) {
      return campaign.statistics.subscriber_count;
    }
    
    // Utiliser delivery_info comme fallback
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info as any;
      if (info.total !== undefined) {
        return Number(info.total);
      }
    }
    
    // Si on est en mode démo, générer une valeur aléatoire
    if (demoMode) {
      return 1000 + Math.floor(Math.random() * 2000);
    }
    
    return 0;
  };

  const getOpenRate = (): number => {
    // Si les statistiques ont été chargées dans l'état local
    if (stats?.uniq_open_rate !== undefined) {
      return stats.uniq_open_rate;
    } else if (stats?.open_rate !== undefined) {
      return stats.open_rate;
    }
    
    // Utiliser les stats de la campagne si disponibles
    if (campaign.statistics?.uniq_open_rate !== undefined) {
      return campaign.statistics.uniq_open_rate;
    } else if (campaign.statistics?.open_rate !== undefined) {
      return campaign.statistics.open_rate;
    }
    
    // Utiliser delivery_info comme fallback
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info as any;
      if (info.unique_open_rate !== undefined) {
        return Number(info.unique_open_rate);
      } else if (info.open_rate !== undefined) {
        return Number(info.open_rate);
      }
    }
    
    // Si on est en mode démo, générer une valeur aléatoire
    if (demoMode) {
      return Math.floor(Math.random() * 60);  // 0-60%
    }
    
    return 0;
  };

  const getClickRate = (): number => {
    // Si les statistiques ont été chargées dans l'état local
    if (stats?.click_rate !== undefined) {
      return stats.click_rate;
    }
    
    // Utiliser les stats de la campagne si disponibles
    if (campaign.statistics?.click_rate !== undefined) {
      return campaign.statistics.click_rate;
    }
    
    // Utiliser delivery_info comme fallback
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info as any;
      if (info.click_rate !== undefined) {
        return Number(info.click_rate);
      }
    }
    
    // Si on est en mode démo, générer une valeur aléatoire
    if (demoMode) {
      return Math.floor(Math.random() * 30);  // 0-30%
    }
    
    return 0;
  };

  const getBounceCount = (): number => {
    // Si les statistiques ont été chargées dans l'état local
    if (stats?.bounce_count !== undefined) {
      return stats.bounce_count;
    }
    
    // Utiliser les stats de la campagne si disponibles
    if (campaign.statistics?.bounce_count !== undefined) {
      return campaign.statistics.bounce_count;
    }
    
    // Utiliser delivery_info comme fallback
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info as any;
      
      if (info.bounced) {
        if (typeof info.bounced === 'object' && info.bounced.total !== undefined) {
          return Number(info.bounced.total);
        }
        if (typeof info.bounced === 'number') {
          return Number(info.bounced);
        }
      }
    }
    
    // Si on est en mode démo, générer une valeur aléatoire
    if (demoMode) {
      return Math.floor(Math.random() * 50);  // 0-50 bounces
    }
    
    return 0;
  };

  // Valeurs à afficher avec génération de valeurs aléatoires en mode démo
  const totalSent = getTotalSent();
  const openRate = getOpenRate();
  const clickRate = getClickRate();
  const bounceCount = getBounceCount();
  
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
