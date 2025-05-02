
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
  // Logging pour suivre les données reçues
  React.useEffect(() => {
    if (campaign) {
      console.log(`Campaign data for ${campaign.name || 'unnamed'}:`, {
        hasStats: !!campaign.statistics,
        hasDeliveryInfo: !!campaign.delivery_info,
        totalSent: campaign.statistics?.subscriber_count || campaign.delivery_info?.total || 0,
        openRate: campaign.statistics?.uniq_open_rate || campaign.delivery_info?.unique_open_rate || 0,
        clickRate: campaign.statistics?.click_rate || campaign.delivery_info?.click_rate || 0,
        bounceCount: campaign.statistics?.bounce_count || (campaign.delivery_info?.bounced?.total) || 0
      });
    }
  }, [campaign]);

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

  // Récupération des statistiques comme dans l'approche "actions"
  // Priorité aux données de statistics puis fallback sur delivery_info
  const totalSent = campaign.statistics?.subscriber_count || 
                   (campaign.delivery_info && typeof campaign.delivery_info.total === 'number' ? campaign.delivery_info.total : 0);
  
  const openRate = campaign.statistics?.uniq_open_rate || 
                  (campaign.delivery_info && typeof campaign.delivery_info.unique_open_rate === 'number' ? campaign.delivery_info.unique_open_rate : 0);
  
  const clickRate = campaign.statistics?.click_rate || 
                   (campaign.delivery_info && typeof campaign.delivery_info.click_rate === 'number' ? campaign.delivery_info.click_rate : 0);
  
  const bounceCount = campaign.statistics?.bounce_count || 
                     (campaign.delivery_info?.bounced && typeof campaign.delivery_info.bounced.total === 'number' ? campaign.delivery_info.bounced.total : 0);

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
          {totalSent.toString()}
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
