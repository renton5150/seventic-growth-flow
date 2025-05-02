
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
   * Fonction améliorée pour extraire les statistiques de manière fiable
   */
  const getStatValue = (key: string): number => {
    try {
      console.log(`Getting stat ${key} for campaign ${campaignUid}`);
      
      // 1. Essayer dans delivery_info qui est notre structure préférée
      if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
        // Log pour debugging
        console.log(`Campaign ${campaignUid} delivery_info:`, campaign.delivery_info);
        
        const directDelivery = campaign.delivery_info[key];
        if (directDelivery !== undefined) {
          const value = Number(directDelivery);
          if (!isNaN(value)) return value;
        }
        
        // Cas spécial pour bounced qui est un objet
        if (key === 'bounce_count' && campaign.delivery_info.bounced) {
          const value = Number(campaign.delivery_info.bounced.total);
          if (!isNaN(value)) return value;
        }
      }
      
      // 2. Essayer dans statistics qui est la structure native de l'API
      if (campaign.statistics && typeof campaign.statistics === 'object') {
        // Log pour debugging
        console.log(`Campaign ${campaignUid} statistics:`, campaign.statistics);
        
        const directStat = campaign.statistics[key];
        if (directStat !== undefined) {
          const value = Number(directStat);
          if (!isNaN(value)) return value;
        }
      }
      
      // 3. Essayer dans la racine de campaign
      const rootValue = campaign[key];
      if (rootValue !== undefined) {
        const value = Number(rootValue);
        if (!isNaN(value)) return value;
      }
      
      // 4. Essayer dans meta
      if (campaign.meta && typeof campaign.meta === 'object') {
        // Directement dans meta
        const metaValue = campaign.meta[key];
        if (metaValue !== undefined) {
          const value = Number(metaValue);
          if (!isNaN(value)) return value;
        }
        
        // Dans meta.statistics
        if (campaign.meta.statistics && campaign.meta.statistics[key] !== undefined) {
          const value = Number(campaign.meta.statistics[key]);
          if (!isNaN(value)) return value;
        }
        
        // Dans meta.delivery_info
        if (campaign.meta.delivery_info && campaign.meta.delivery_info[key] !== undefined) {
          const value = Number(campaign.meta.delivery_info[key]);
          if (!isNaN(value)) return value;
        }
      }
      
      // 5. Vérifier dans track (maintenant défini comme un objet vide par défaut)
      if (campaign.track && typeof campaign.track === 'object') {
        const trackValue = campaign.track[key];
        if (trackValue !== undefined) {
          const value = Number(trackValue);
          if (!isNaN(value)) return value;
        }
      }
      
      // 6. Vérifier dans report (maintenant défini comme un objet vide par défaut)
      if (campaign.report && typeof campaign.report === 'object') {
        const reportValue = campaign.report[key];
        if (reportValue !== undefined) {
          const value = Number(reportValue);
          if (!isNaN(value)) return value;
        }
      }
      
      // Essayer les mappings alternatifs de clés
      const keyMappings: Record<string, string[]> = {
        'subscriber_count': ['total', 'recipient_count', 'subscribers_count', 'total_subscribers'],
        'delivered_count': ['delivered'],
        'delivered_rate': ['delivery_rate'],
        'uniq_open_rate': ['open_rate', 'unique_open_rate'],
        'open_count': ['opened'],
        'click_rate': ['click_percentage'],
        'bounce_count': ['bounced.total', 'total_bounces'],
        'unsubscribe_count': ['unsubscribed']
      };
      
      if (keyMappings[key]) {
        for (const altKey of keyMappings[key]) {
          // Gestion des clés imbriquées comme 'bounced.total'
          if (altKey.includes('.')) {
            const [parent, child] = altKey.split('.');
            
            if (campaign.delivery_info && campaign.delivery_info[parent]) {
              const value = Number(campaign.delivery_info[parent][child]);
              if (!isNaN(value)) return value;
            }
            
            if (campaign.statistics && campaign.statistics[parent]) {
              const value = Number(campaign.statistics[parent][child]);
              if (!isNaN(value)) return value;
            }
            
            continue;
          }
          
          // Pour les clés simples
          // delivery_info (prioritaire)
          if (campaign.delivery_info && altKey in campaign.delivery_info) {
            const value = Number(campaign.delivery_info[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // statistics
          if (campaign.statistics && altKey in campaign.statistics) {
            const value = Number(campaign.statistics[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // racine
          if (altKey in campaign) {
            const value = Number(campaign[altKey]);
            if (!isNaN(value)) return value;
          }
        }
      }

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
