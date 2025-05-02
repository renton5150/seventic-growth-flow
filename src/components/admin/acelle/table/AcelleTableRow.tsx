
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { 
  translateStatus, 
  getStatusBadgeVariant, 
  renderPercentage, 
  extractCampaignStat 
} from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
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

  // Extraction des statistiques clés en utilisant notre utilitaire amélioré
  const totalSent = extractCampaignStat(campaign, 'subscriber_count');
  const openRate = extractCampaignStat(campaign, 'uniq_open_rate');
  const clickRate = extractCampaignStat(campaign, 'click_rate');
  const bounceCount = extractCampaignStat(campaign, 'bounce_count');

  // Journaliser les données de la campagne pour le débogage (version détaillée)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Données pour campagne ${campaignName}:`, {
        id: campaignUid,
        stats: {
          totalSent,
          openRate,
          clickRate,
          bounceCount
        },
        rawData: {
          delivery_info: campaign.delivery_info,
          statistics: campaign.statistics
        }
      });
    }
  }, [campaign, campaignName, campaignUid, totalSent, openRate, clickRate, bounceCount]);

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
