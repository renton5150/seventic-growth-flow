
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { 
  translateStatus, 
  getStatusBadgeVariant, 
  renderPercentage, 
  formatNumberSafely, 
  extractOpenRate, 
  extractClickRate,
  diagnoseCampaignStatistics
} from "@/utils/acelle/campaignStatusUtils";
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
        hasStatistics: !!campaign.statistics
      });
      
      // Exécuter le diagnostic pour comprendre la structure des données
      diagnoseCampaignStatistics(campaign);
      
      // Si nous avons déjà des statistiques fonctionnelles, pas besoin de recharger
      const existingOpenRate = extractOpenRate(campaign.delivery_info || campaign.statistics);
      const existingClickRate = extractClickRate(campaign.delivery_info || campaign.statistics);
      
      if (existingOpenRate > 0 || existingClickRate > 0) {
        console.log(`[TableRow] Statistiques déjà disponibles pour ${campaignName}, utilisation directe`, {
          openRate: existingOpenRate,
          clickRate: existingClickRate
        });
        
        // Utiliser directement les statistiques existantes
        setStats(campaign.delivery_info as AcelleCampaignStatistics || 
                 campaign.statistics as AcelleCampaignStatistics || null);
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
        
        // Exécuter le diagnostic sur les données enrichies
        console.log(`[TableRow] Statistiques récupérées pour ${campaignName}:`);
        diagnoseCampaignStatistics(enrichedCampaign);
        
        // Mettre à jour l'état local avec les statistiques récupérées
        if (enrichedCampaign) {
          setStats(enrichedCampaign.statistics || enrichedCampaign.delivery_info as AcelleCampaignStatistics);
          
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

  // Utiliser nos nouvelles fonctions d'extraction robustes
  const totalSent = parseFloat(String(
    campaign.statistics?.subscriber_count || 
    campaign.delivery_info?.subscriber_count || 
    campaign.delivery_info?.total || 0
  ));
  
  const openRate = extractOpenRate(campaign.statistics || campaign.delivery_info);
  const clickRate = extractClickRate(campaign.statistics || campaign.delivery_info);
  
  const bounceCount = parseFloat(String(
    campaign.statistics?.bounce_count || 
    (typeof campaign.delivery_info?.bounced === 'object' ? 
      campaign.delivery_info?.bounced?.total : 
      campaign.delivery_info?.bounced) || 
    campaign.delivery_info?.bounce_count || 0
  ));
  
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
