
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { AcelleCampaign } from "@/types/acelle.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  onView?: (campaignId: string) => void;
}

export const AcelleTableRow = ({ campaign, onView }: AcelleTableRowProps) => {
  // Format delivery date if available
  const formattedDate = campaign.delivery_date
    ? format(new Date(campaign.delivery_date), 'dd MMM yyyy', { locale: fr })
    : "Non défini";
  
  // Get statistics
  const totalRecipients = campaign.statistics?.subscriber_count || campaign.delivery_info?.total || 0;
  const openRate = campaign.statistics?.uniq_open_rate || campaign.delivery_info?.unique_open_rate || 0;
  const clickRate = campaign.statistics?.click_rate || campaign.delivery_info?.click_rate || 0;
  
  // Format status
  const getStatusClassName = () => {
    switch (campaign.status?.toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'sending':
        return 'bg-blue-100 text-blue-700';
      case 'ready':
        return 'bg-cyan-100 text-cyan-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'paused':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const formatStatus = () => {
    switch (campaign.status?.toLowerCase()) {
      case 'sent':
        return 'Envoyée';
      case 'sending':
        return 'En cours';
      case 'ready':
        return 'Prête';
      case 'failed':
        return 'Échec';
      case 'paused':
        return 'En pause';
      default:
        return campaign.status || 'Inconnu';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{campaign.name}</TableCell>
      <TableCell className="max-w-[200px] truncate">{campaign.subject}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName()}`}>
          {formatStatus()}
        </span>
      </TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell className="text-right">{totalRecipients.toLocaleString()}</TableCell>
      <TableCell className="text-right">{(openRate * 100).toFixed(1)}%</TableCell>
      <TableCell className="text-right">{(clickRate * 100).toFixed(1)}%</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView && onView(campaign.uid)}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
