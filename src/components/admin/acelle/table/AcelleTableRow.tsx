
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

  // Helper to safely render numeric values
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Debug logging to troubleshoot missing data
  console.log(`Rendering campaign ${campaign.name}:`, {
    delivery_info: campaign.delivery_info,
    statistics: campaign.statistics,
    delivery_date: campaign.delivery_date
  });

  return (
    <TableRow key={campaign.uid}>
      <TableCell className="font-medium max-w-[120px] truncate">
        {campaign.name}
      </TableCell>
      <TableCell className="max-w-[180px] truncate">
        {campaign.subject}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaign.status) as any}>
          {translateStatus(campaign.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {formatDateSafely(campaign.delivery_date || campaign.run_at)}
      </TableCell>
      <TableCell>
        {safeNumber(campaign.delivery_info?.total) || safeNumber(campaign.statistics?.subscriber_count) || 0}
      </TableCell>
      <TableCell>
        <div>
          <div>{safeNumber(campaign.delivery_info?.delivered) || safeNumber(campaign.statistics?.delivered_count) || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.delivery_rate || campaign.statistics?.delivered_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{safeNumber(campaign.delivery_info?.opened) || safeNumber(campaign.statistics?.open_count) || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.unique_open_rate || campaign.statistics?.uniq_open_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{safeNumber(campaign.delivery_info?.clicked) || safeNumber(campaign.statistics?.click_count) || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.click_rate || campaign.statistics?.click_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>
            {safeNumber(campaign.delivery_info?.bounced?.total) || 
             safeNumber(campaign.statistics?.bounce_count) || 0}
          </div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.bounce_rate || (safeNumber(campaign.statistics?.bounce_count) / safeNumber(campaign.statistics?.subscriber_count) * 100))}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>
            {safeNumber(campaign.delivery_info?.unsubscribed) || 
             safeNumber(campaign.statistics?.unsubscribe_count) || 0}
          </div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.unsubscribe_rate || (safeNumber(campaign.statistics?.unsubscribe_count) / safeNumber(campaign.statistics?.subscriber_count) * 100))}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewCampaign(campaign.uid)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
