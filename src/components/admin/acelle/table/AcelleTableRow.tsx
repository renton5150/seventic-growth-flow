
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
  // Fonction pour rendre un pourcentage de manière cohérente
  const renderPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  // Fonction pour extraire les données statistiques de manière sécurisée
  const extractStat = (key: string): number => {
    try {
      // Essayer d'abord avec delivery_info
      if (campaign.delivery_info) {
        // Cas spéciaux pour les statistiques de bounce
        if (key === 'bounce_count' && campaign.delivery_info.bounced) {
          return typeof campaign.delivery_info.bounced.total === 'number' ? campaign.delivery_info.bounced.total : 0;
        }
        
        // Mapping des clés pour delivery_info
        const deliveryInfoMap: Record<string, string> = {
          'subscriber_count': 'total',
          'delivered_count': 'delivered',
          'open_count': 'opened',
          'click_count': 'clicked',
          'uniq_open_rate': 'unique_open_rate',
          'click_rate': 'click_rate'
        };
        
        const mappedKey = deliveryInfoMap[key];
        if (mappedKey && typeof campaign.delivery_info[mappedKey] === 'number') {
          return campaign.delivery_info[mappedKey] as number;
        }
      }
      
      // Puis essayer avec statistics
      if (campaign.statistics && typeof campaign.statistics[key as keyof typeof campaign.statistics] === 'number') {
        return campaign.statistics[key as keyof typeof campaign.statistics] as number;
      }
      
      // Fallback à 0 si rien n'est trouvé
      return 0;
    } catch (error) {
      console.warn(`Erreur lors de l'extraction de ${key}:`, error);
      return 0;
    }
  };

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

  // Extraction des statistiques clés
  const totalSent = extractStat('subscriber_count');
  const openRate = extractStat('uniq_open_rate');
  const clickRate = extractStat('click_rate');
  const bounceCount = extractStat('bounce_count');

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
  
  return (
    <TableRow>
      <TableCell className="font-medium">{campaignName}</TableCell>
      <TableCell>{campaignSubject}</TableCell>
      <TableCell>
        <Badge variant={variant}>{statusDisplay}</Badge>
      </TableCell>
      <TableCell>{formatDateSafely(deliveryDate)}</TableCell>
      <TableCell className="font-medium tabular-nums">
        {totalSent.toLocaleString()}
      </TableCell>
      <TableCell className="tabular-nums">
        {renderPercentage(openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {renderPercentage(clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {bounceCount.toLocaleString()}
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
