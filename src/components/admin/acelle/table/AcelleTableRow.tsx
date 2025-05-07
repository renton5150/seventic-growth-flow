
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { AcelleCampaign } from "@/types/acelle.types";
import { Badge } from "@/components/ui/badge";
import { formatDateString } from "@/utils/dateUtils";
import { translateStatus } from "@/utils/acelle/campaignStats";

export interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onView: (campaignId: string) => void;
}

export const AcelleTableRow = ({ campaign, onView }: AcelleTableRowProps) => {
  // Extraire les statistiques (ou utiliser des valeurs par défaut)
  const stats = campaign.statistics || {
    subscriber_count: 0,
    open_count: 0,
    click_count: 0,
    open_rate: 0,
    click_rate: 0
  };
  
  // Déterminer la couleur du badge de statut
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'sending':
        return 'warning';
      case 'ready':
      case 'queued':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'paused':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {campaign.name || '(Sans nom)'}
      </TableCell>
      <TableCell>
        {campaign.subject || '(Sans sujet)'}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(campaign.status)}>
          {translateStatus(campaign.status) || 'Inconnu'}
        </Badge>
      </TableCell>
      <TableCell>
        {campaign.delivery_date ? formatDateString(campaign.delivery_date) : 'Non planifiée'}
      </TableCell>
      <TableCell className="text-right">
        {stats.subscriber_count?.toLocaleString() || '0'}
      </TableCell>
      <TableCell className="text-right">
        {typeof stats.open_rate === 'number'
          ? `${(stats.open_rate * 100).toFixed(1)}%`
          : '0.0%'}
      </TableCell>
      <TableCell className="text-right">
        {typeof stats.click_rate === 'number'
          ? `${(stats.click_rate * 100).toFixed(1)}%`
          : '0.0%'}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onView(campaign.uid || campaign.campaign_uid)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Détails
        </Button>
      </TableCell>
    </TableRow>
  );
};
