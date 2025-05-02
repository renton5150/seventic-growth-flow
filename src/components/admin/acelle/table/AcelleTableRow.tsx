
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Mail, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
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
        openRate: campaign.statistics?.uniq_open_rate || campaign.delivery_info?.unique_open_rate || 0,
        clickRate: campaign.statistics?.click_rate || campaign.delivery_info?.click_rate || 0,
        bounceCount: campaign.statistics?.bounce_count || (campaign.delivery_info?.bounced?.total) || 0
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
   */
  const getStatValue = (key: string): number => {
    try {
      // Définir des valeurs par défaut pour éviter les erreurs
      let value = 0;

      // Struct 1: statistics (prioritaire car plus structurée)
      if (campaign.statistics && typeof campaign.statistics === 'object') {
        const stats = campaign.statistics;
        
        // Vérifier les propriétés disponibles
        switch(key) {
          case 'subscriber_count':
            if (typeof stats.subscriber_count === 'number') return stats.subscriber_count;
            break;
          case 'uniq_open_rate':
            if (typeof stats.uniq_open_rate === 'number') return stats.uniq_open_rate;
            break;
          case 'click_rate':
            if (typeof stats.click_rate === 'number') return stats.click_rate;
            break;
          case 'bounce_count':
            if (typeof stats.bounce_count === 'number') return stats.bounce_count;
            break;
        }
      }

      // Struct 2: delivery_info (format alternatif)
      if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
        const info = campaign.delivery_info;
        
        // Vérifier les propriétés les plus communes
        switch(key) {
          case 'subscriber_count':
            if (typeof info.total === 'number') return info.total;
            break;
          case 'uniq_open_rate':
            if (typeof info.unique_open_rate === 'number') return info.unique_open_rate;
            break;
          case 'click_rate':
            if (typeof info.click_rate === 'number') return info.click_rate;
            break;
          case 'bounce_count':
            // Cas spécial pour les bounces qui sont dans un sous-objet
            if (info.bounced && typeof info.bounced === 'object') {
              if (typeof info.bounced.total === 'number') return info.bounced.total;
              
              // Si pas de "total" mais "soft" et "hard" disponibles
              const softBounce = typeof info.bounced.soft === 'number' ? info.bounced.soft : 0;
              const hardBounce = typeof info.bounced.hard === 'number' ? info.bounced.hard : 0;
              return softBounce + hardBounce;
            }
            break;
        }
      }

      return value;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de la statistique '${key}'`, error);
      return 0;
    }
  };

  // Extraire les valeurs statistiques de manière sûre
  const subscriberCount = getStatValue('subscriber_count');
  const openRate = getStatValue('uniq_open_rate');
  const clickRate = getStatValue('click_rate');
  const bounceCount = getStatValue('bounce_count');

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
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          {subscriberCount.toString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <ArrowUp className="h-4 w-4 mr-2 text-green-500" />
          {renderPercentage(openRate)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <ArrowRight className="h-4 w-4 mr-2 text-blue-500" />
          {renderPercentage(clickRate)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <ArrowDown className="h-4 w-4 mr-2 text-red-500" />
          {bounceCount.toString()}
        </div>
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
