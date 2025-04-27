
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (error) {
      console.error(`Invalid date: ${date}`, error);
      return "-";
    }
  };

  const renderDeliveryInfo = () => {
    const info = campaign.delivery_info || {};
    
    return {
      total: info.total || 0,
      delivered: info.delivered || 0,
      opened: info.opened || 0,
      clicked: info.clicked || 0,
      bounced: info.bounced?.total || 0,
      unsubscribed: info.unsubscribed || 0,
      openRate: info.unique_open_rate || 0,
      clickRate: info.click_rate || 0
    };
  };

  const info = renderDeliveryInfo();

  return (
    <TableRow>
      <TableCell className="font-medium max-w-[150px] truncate" title={campaign.name}>
        {campaign.name}
      </TableCell>
      <TableCell className="max-w-[150px] truncate" title={campaign.subject || ""}>
        {campaign.subject}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaign.status) as any}>
          {translateStatus(campaign.status)}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(campaign.run_at)}</TableCell>
      <TableCell>{info.total}</TableCell>
      <TableCell>{info.delivered}</TableCell>
      <TableCell>{renderPercentage(info.openRate)}</TableCell>
      <TableCell>{renderPercentage(info.clickRate)}</TableCell>
      <TableCell>{info.bounced}</TableCell>
      <TableCell>{info.unsubscribed}</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewCampaign(campaign.uid)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
      </TableCell>
    </TableRow>
  );
};

