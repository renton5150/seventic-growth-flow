
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
  // Logging amélioré pour suivre les problèmes de données
  React.useEffect(() => {
    if (campaign) {
      console.log(`Campaign render for ${campaign.name || 'unnamed'} (${campaign.uid || 'no-uid'}):`, {
        hasStatistics: !!campaign.statistics,
        hasDeliveryInfo: !!campaign.delivery_info,
        subscriberCount: campaign.statistics?.subscriber_count || campaign.delivery_info?.total || 0,
        deliveryRate: campaign.statistics?.delivered_rate || campaign.delivery_info?.delivery_rate || 0,
        openRate: campaign.statistics?.uniq_open_rate || campaign.delivery_info?.unique_open_rate || 0,
        clickRate: campaign.statistics?.click_rate || campaign.delivery_info?.click_rate || 0
      });
    }
  }, [campaign]);

  // Debug léger pour éviter de surcharger la console
  if (!campaign) {
    console.error("Campagne non définie dans AcelleTableRow");
    return null;
  }
  
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantie de valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;
  
  /**
   * Formatage sécurisé des dates
   */
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

  // Obtenir l'affichage et le style du statut
  const statusDisplay = translateStatus(campaignStatus);
  const variant = getStatusBadgeVariant(campaignStatus) as "default" | "secondary" | "destructive" | "outline";

  /**
   * Fonction optimisée pour extraire les statistiques de manière plus directe et fiable
   * Se concentre sur les chemins les plus probables où se trouvent les données
   */
  const getStatValue = (key: string): number => {
    try {
      // Log pour debugging, avec plus de détails sur les structures disponibles
      console.log(`Getting stat ${key} for campaign ${campaignUid}`, {
        hasStatistics: !!campaign.statistics,
        hasDeliveryInfo: !!campaign.delivery_info,
        statisticsKeys: campaign.statistics ? Object.keys(campaign.statistics) : 'none',
        deliveryInfoKeys: campaign.delivery_info ? Object.keys(campaign.delivery_info) : 'none'
      });
      
      // Approche directe: regarder d'abord dans statistics qui est notre structure standard
      if (campaign.statistics && key in campaign.statistics) {
        const value = parseFloat(campaign.statistics[key] as any);
        if (!isNaN(value)) {
          console.log(`Found value in statistics.${key}: ${value}`);
          return value;
        }
      }
      
      // Ensuite, chercher dans delivery_info qui est notre structure alternative
      if (campaign.delivery_info) {
        // Cas spécial pour bounce_count qui est dans un sous-objet dans delivery_info
        if (key === 'bounce_count' && campaign.delivery_info.bounced) {
          const value = parseFloat(campaign.delivery_info.bounced.total as any);
          if (!isNaN(value)) {
            console.log(`Found bounce_count in delivery_info.bounced.total: ${value}`);
            return value;
          }
        }
        
        // Mappings directs entre les clés statistics et delivery_info
        const deliveryInfoMappings: Record<string, string> = {
          'subscriber_count': 'total',
          'delivered_count': 'delivered',
          'delivered_rate': 'delivery_rate',
          'open_count': 'opened',
          'uniq_open_rate': 'unique_open_rate',
          'click_count': 'clicked',
          'click_rate': 'click_rate',
          'unsubscribe_count': 'unsubscribed'
        };
        
        // Si la clé a un mapping dans delivery_info
        if (deliveryInfoMappings[key] && deliveryInfoMappings[key] in campaign.delivery_info) {
          const mappedKey = deliveryInfoMappings[key];
          const value = parseFloat(campaign.delivery_info[mappedKey] as any);
          if (!isNaN(value)) {
            console.log(`Found value in delivery_info.${mappedKey}: ${value}`);
            return value;
          }
        }
      }
      
      // Chercher directement dans la racine de campaign (peu probable mais possible)
      if (key in campaign) {
        const value = parseFloat(campaign[key] as any);
        if (!isNaN(value)) {
          console.log(`Found value in campaign.${key}: ${value}`);
          return value;
        }
      }

      // Dernier recours: recherche de fallbacks spécifiques
      switch (key) {
        case 'subscriber_count':
          // Chercher la valeur total dans différents endroits
          if (campaign.delivery_info?.total !== undefined) return parseFloat(campaign.delivery_info.total as any) || 0;
          if (campaign.statistics?.subscriber_count !== undefined) return parseFloat(campaign.statistics.subscriber_count as any) || 0;
          break;
        case 'delivered_rate':
          // Chercher le taux de livraison
          if (campaign.delivery_info?.delivery_rate !== undefined) return parseFloat(campaign.delivery_info.delivery_rate as any) || 0;
          break;
        case 'uniq_open_rate':
          // Chercher le taux d'ouverture unique
          if (campaign.delivery_info?.unique_open_rate !== undefined) return parseFloat(campaign.delivery_info.unique_open_rate as any) || 0;
          if (campaign.statistics?.uniq_open_rate !== undefined) return parseFloat(campaign.statistics.uniq_open_rate as any) || 0;
          break;
        case 'click_rate':
          // Chercher le taux de clic
          if (campaign.delivery_info?.click_rate !== undefined) return parseFloat(campaign.delivery_info.click_rate as any) || 0;
          if (campaign.statistics?.click_rate !== undefined) return parseFloat(campaign.statistics.click_rate as any) || 0;
          break;
      }

      // Si rien n'a été trouvé, logguer et retourner 0
      console.log(`No valid value found for stat ${key}, returning 0`);
      return 0;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de la statistique '${key}' pour la campagne ${campaign?.name}:`, error);
      return 0;
    }
  };

  // Extraire les valeurs statistiques avec notre fonction améliorée
  const subscriberCount = getStatValue('subscriber_count');
  const deliveryRate = getStatValue('delivered_rate');
  const openRate = getStatValue('uniq_open_rate');
  const clickRate = getStatValue('click_rate');
  const bounceCount = getStatValue('bounce_count');
  const unsubscribeCount = getStatValue('unsubscribe_count');
  
  // Log final des valeurs extraites pour vérifier
  console.log(`Final stats for campaign ${campaignName}:`, {
    subscriberCount,
    deliveryRate,
    openRate,
    clickRate,
    bounceCount,
    unsubscribeCount
  });

  const handleViewClick = () => {
    if (campaignUid) {
      onViewCampaign(campaignUid);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[200px]" title={campaignName}>
        {campaignName}
      </TableCell>
      <TableCell className="truncate max-w-[200px]" title={campaignSubject}>
        {campaignSubject}
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{statusDisplay}</Badge>
      </TableCell>
      <TableCell>
        {formatDateSafely(deliveryDate)}
      </TableCell>
      <TableCell>
        {subscriberCount.toString()}
      </TableCell>
      <TableCell>
        {renderPercentage(deliveryRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(openRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(clickRate)}
      </TableCell>
      <TableCell>
        {bounceCount.toString()}
      </TableCell>
      <TableCell>
        {unsubscribeCount.toString()}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleViewClick}
          title="Voir les détails"
          disabled={!campaignUid}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
