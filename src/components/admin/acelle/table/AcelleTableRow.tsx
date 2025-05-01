
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
  const campaignUid = campaign?.uid || '';
  
  // Garantie de valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback - Utiliser delivery_date au lieu de delivery_at
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
   * Fonction optimisée pour extraire les statistiques de manière fiable
   * en parcourant différentes structures possibles
   */
  const getStatValue = (key: string): number => {
    try {
      // 1. Essayer d'abord dans statistics
      if (campaign.statistics && typeof campaign.statistics === 'object') {
        if (key in campaign.statistics && campaign.statistics[key] !== undefined) {
          const value = Number(campaign.statistics[key]);
          if (!isNaN(value)) return value;
        }
      }
      
      // 2. Essayer ensuite dans delivery_info
      if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
        if (key in campaign.delivery_info && campaign.delivery_info[key] !== undefined) {
          const value = Number(campaign.delivery_info[key]);
          if (!isNaN(value)) return value;
        }
        
        // Cas spécial pour bounced qui est un objet
        if (key === 'bounce_count' && campaign.delivery_info.bounced) {
          const value = Number(campaign.delivery_info.bounced.total);
          if (!isNaN(value)) return value;
        }
      }
      
      // 3. Essayer dans la racine de campaign
      if (key in campaign && campaign[key] !== undefined) {
        const value = Number(campaign[key]);
        if (!isNaN(value)) return value;
      }
      
      // 4. Essayer dans meta
      if (campaign.meta && typeof campaign.meta === 'object') {
        // Directement dans meta
        if (key in campaign.meta && campaign.meta[key] !== undefined) {
          const value = Number(campaign.meta[key]);
          if (!isNaN(value)) return value;
        }
        
        // Dans meta.statistics
        if (campaign.meta.statistics && key in campaign.meta.statistics) {
          const value = Number(campaign.meta.statistics[key]);
          if (!isNaN(value)) return value;
        }
        
        // Dans meta.delivery_info
        if (campaign.meta.delivery_info && key in campaign.meta.delivery_info) {
          const value = Number(campaign.meta.delivery_info[key]);
          if (!isNaN(value)) return value;
        }
      }
      
      // 5. Vérifier éventuellement dans track et report si disponibles
      if (campaign.track && typeof campaign.track === 'object') {
        if (key in campaign.track && campaign.track[key] !== undefined) {
          const value = Number(campaign.track[key]);
          if (!isNaN(value)) return value;
        }
      }
      
      if (campaign.report && typeof campaign.report === 'object') {
        if (key in campaign.report && campaign.report[key] !== undefined) {
          const value = Number(campaign.report[key]);
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
      
      if (key in keyMappings) {
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
            
            if (campaign.meta && campaign.meta.delivery_info && campaign.meta.delivery_info[parent]) {
              const value = Number(campaign.meta.delivery_info[parent][child]);
              if (!isNaN(value)) return value;
            }
            
            continue;
          }
          
          // Pour les clés simples, parcourir les objets
          // statistics
          if (campaign.statistics && altKey in campaign.statistics) {
            const value = Number(campaign.statistics[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // delivery_info
          if (campaign.delivery_info && altKey in campaign.delivery_info) {
            const value = Number(campaign.delivery_info[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // racine
          if (altKey in campaign) {
            const value = Number(campaign[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // meta
          if (campaign.meta && altKey in campaign.meta) {
            const value = Number(campaign.meta[altKey]);
            if (!isNaN(value)) return value;
          }
          
          // track si disponible
          if (campaign.track && altKey in campaign.track) {
            const value = Number(campaign.track[altKey]);
            if (!isNaN(value)) return value;
          }
        }
      }

      return 0;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de la statistique '${key}':`, error);
      return 0;
    }
  };

  // Extraire les valeurs statistiques
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
