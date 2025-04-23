
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
        {campaign.run_at 
          ? format(new Date(campaign.run_at), "dd/MM/yyyy HH:mm", { locale: fr }) 
          : "Non programmé"}
      </TableCell>
      <TableCell>
        {campaign.delivery_info?.total || 0}
      </TableCell>
      <TableCell>
        {renderPercentage(campaign.delivery_info?.unique_open_rate)}
      </TableCell>
      <TableCell>
        {renderPercentage(campaign.delivery_info?.click_rate)}
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
};
