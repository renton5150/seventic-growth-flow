
import { formatDate } from "@/utils/dateUtils";
import { AcelleCampaign } from "@/types/acelle.types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow = ({ campaign, onViewCampaign }: AcelleTableRowProps) => {
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Get status display
  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "sent" || statusLower === "done") return "default";
    if (statusLower === "sending") return "default";
    if (statusLower === "ready") return "default";
    if (statusLower === "failed") return "destructive";
    if (statusLower === "paused") return "outline";
    if (statusLower === "scheduled") return "outline";
    return "outline";
  };

  // Make sure delivery_info has default values if it's empty
  const deliveryInfo = campaign.delivery_info || {
    total_emails: 0,
    delivered: 0,
    open_rate: 0,
    click_rate: 0,
    bounce_rate: 0,
    unsubscribe_rate: 0,
    // Backwards compatibility fields
    total: 0,
    opened: 0,
    clicked: 0,
    bounced: { total: 0 },
    unsubscribed: 0,
    unique_open_rate: 0
  };
  
  // Use both old and new property names for compatibility
  const total = deliveryInfo.total || deliveryInfo.total_emails || 0;
  const delivered = deliveryInfo.delivered || 0;
  const opened = deliveryInfo.opened || 0;
  const clicked = deliveryInfo.clicked || 0;
  const bounced = (deliveryInfo.bounced?.total) || 0;
  const unsubscribed = deliveryInfo.unsubscribed || 0;
  const openRate = deliveryInfo.unique_open_rate || deliveryInfo.open_rate || 0;
  const clickRate = deliveryInfo.click_rate || 0;

  return (
    <TableRow>
      <TableCell>{campaign.name}</TableCell>
      <TableCell>{campaign.subject}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(campaign.status || '')}>
          {campaign.status}
        </Badge>
      </TableCell>
      <TableCell>{campaign.run_at ? formatDate(campaign.run_at) : "Non envoyé"}</TableCell>
      <TableCell>{total.toLocaleString()}</TableCell>
      <TableCell>{delivered.toLocaleString()}</TableCell>
      <TableCell>{formatPercent(openRate)}</TableCell>
      <TableCell>{formatPercent(clickRate)}</TableCell>
      <TableCell>{bounced.toLocaleString()}</TableCell>
      <TableCell>{unsubscribed.toLocaleString()}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => onViewCampaign(campaign.uid)}>
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
