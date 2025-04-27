
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow: React.FC<AcelleTableRowProps> = ({ campaign, onViewCampaign }) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (e) {
      return "Date invalide";
    }
  };

  // Ensure delivery_info has default values if it's missing
  const deliveryInfo = campaign.delivery_info || {
    total: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: { total: 0 },
    unsubscribed: 0,
    unique_open_rate: 0,
    click_rate: 0
  };

  const total = deliveryInfo.total || 0;
  const delivered = deliveryInfo.delivered || 0;
  const opened = deliveryInfo.opened || 0;
  const clicked = deliveryInfo.clicked || 0;
  const bounced = deliveryInfo.bounced?.total || 0;
  const unsubscribed = deliveryInfo.unsubscribed || 0;
  const openRate = deliveryInfo.unique_open_rate || 0;
  const clickRate = deliveryInfo.click_rate || 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{campaign.name}</TableCell>
      <TableCell>{campaign.subject || "—"}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaign.status)}>
          {translateStatus(campaign.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {campaign.run_at ? formatDate(campaign.run_at) : "Non envoyée"}
      </TableCell>
      <TableCell>{total}</TableCell>
      <TableCell>{delivered}</TableCell>
      <TableCell>{renderPercentage(openRate)}</TableCell>
      <TableCell>{renderPercentage(clickRate)}</TableCell>
      <TableCell>{bounced}</TableCell>
      <TableCell>{unsubscribed}</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onViewCampaign(campaign.uid)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Voir les détails</span>
        </Button>
      </TableCell>
    </TableRow>
  );
};
