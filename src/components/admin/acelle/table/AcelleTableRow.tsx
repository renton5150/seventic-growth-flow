
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface AcelleTableRowProps {
  campaign: any;
  onViewCampaign: (uid: string) => void;
}

export const AcelleTableRow: React.FC<AcelleTableRowProps> = ({ campaign, onViewCampaign }) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{campaign.name}</TableCell>
      <TableCell>{campaign.subject}</TableCell>
      <TableCell>
        <Badge variant="outline">Indisponible</Badge>
      </TableCell>
      <TableCell>Indisponible</TableCell>
      <TableCell>0</TableCell>
      <TableCell>0</TableCell>
      <TableCell>0%</TableCell>
      <TableCell>0%</TableCell>
      <TableCell>0</TableCell>
      <TableCell>0</TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onViewCampaign(campaign.uid)}>
          <Eye className="h-4 w-4 mr-1" /> Voir
        </Button>
      </TableCell>
    </TableRow>
  );
};
