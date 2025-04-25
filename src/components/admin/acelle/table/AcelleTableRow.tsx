
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
        {campaign.delivery_date 
          ? format(new Date(campaign.delivery_date), "dd/MM/yyyy HH:mm", { locale: fr }) 
          : "Non programmé"}
      </TableCell>
      <TableCell>
        {campaign.delivery_info?.total || 0}
      </TableCell>
      <TableCell>
        <div>
          <div>{campaign.delivery_info?.delivered || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.delivery_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{campaign.delivery_info?.opened || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.unique_open_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{campaign.delivery_info?.clicked || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.click_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{campaign.delivery_info?.bounced?.total || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.bounce_rate)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{campaign.delivery_info?.unsubscribed || 0}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(campaign.delivery_info?.unsubscribe_rate)}
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
