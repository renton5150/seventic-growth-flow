
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
  // Helper function to safely format dates
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
      console.error(`Invalid date: ${dateString}`, error);
      return "Date invalide";
    }
  };

  // Helper function to render numeric values safely
  const renderNumeric = (value: number | undefined | null, suffix = "") => {
    if (value === undefined || value === null) return "-";
    return `${value}${suffix}`;
  };

  // Helper function to render percentage values safely
  const renderPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "-";
    // Format as percentage with 2 decimal places
    return `${(value * 100).toFixed(2)}%`;
  };

  // Get status and delivery info
  const status = campaign.status || "unknown";
  const statusDisplay = translateStatus(status);
  const variant = getStatusBadgeVariant(status);

  // Get statistics with null safety
  const stats = campaign.statistics || {};
  const deliveryInfo = campaign.delivery_info || {};

  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[200px]" title={campaign.name}>
        {campaign.name || "Sans nom"}
      </TableCell>
      <TableCell className="truncate max-w-[200px]" title={campaign.subject}>
        {campaign.subject || "Sans sujet"}
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{statusDisplay}</Badge>
      </TableCell>
      <TableCell>
        {formatDateSafely(campaign.delivery_date)}
      </TableCell>
      <TableCell>
        {renderNumeric(stats.subscriber_count || deliveryInfo.total)}
      </TableCell>
      <TableCell>
        {renderPercent(stats.delivered_rate || deliveryInfo.delivery_rate)}
      </TableCell>
      <TableCell>
        {renderPercent(stats.uniq_open_rate || deliveryInfo.unique_open_rate)}
      </TableCell>
      <TableCell>
        {renderPercent(stats.click_rate || deliveryInfo.click_rate)}
      </TableCell>
      <TableCell>
        {renderNumeric(stats.bounce_count || (deliveryInfo.bounced && deliveryInfo.bounced.total))}
      </TableCell>
      <TableCell>
        {renderNumeric(stats.unsubscribe_count || deliveryInfo.unsubscribed)}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onViewCampaign(campaign.uid)}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
