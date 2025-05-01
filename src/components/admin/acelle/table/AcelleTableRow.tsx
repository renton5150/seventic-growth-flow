
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

  // Get status and delivery info
  const status = campaign.status || "unknown";
  const statusDisplay = translateStatus(status);
  
  // Fix: Cast the variant to the correct type for Badge component
  const variant = getStatusBadgeVariant(status) as "default" | "secondary" | "destructive" | "outline";

  // Helper function to safely render numeric values with fallbacks
  const renderNumeric = (value: number | string | undefined | null, suffix = "") => {
    if (value === undefined || value === null) return "-";
    return `${value}${suffix}`;
  };
  
  // Safely extract statistics values with fallbacks
  const getStatValue = (path: string[], defaultValue: number = 0): number => {
    try {
      let obj: any = campaign;
      for (const key of path) {
        if (!obj || typeof obj !== 'object') return defaultValue;
        obj = obj[key];
      }
      return typeof obj === 'number' ? obj : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Get values with multiple fallbacks
  const subscriberCount = getStatValue(['statistics', 'subscriber_count']) || 
                         getStatValue(['delivery_info', 'total']) || 0;
                         
  const deliveryRate = getStatValue(['statistics', 'delivered_rate']) || 
                      getStatValue(['delivery_info', 'delivery_rate']) || 0;
                      
  const openRate = getStatValue(['statistics', 'uniq_open_rate']) || 
                  getStatValue(['delivery_info', 'unique_open_rate']) || 0;
                  
  const clickRate = getStatValue(['statistics', 'click_rate']) || 
                   getStatValue(['delivery_info', 'click_rate']) || 0;
                   
  const bounceCount = getStatValue(['statistics', 'bounce_count']) || 
                     getStatValue(['delivery_info', 'bounced', 'total']) || 0;
                     
  const unsubscribeCount = getStatValue(['statistics', 'unsubscribe_count']) || 
                          getStatValue(['delivery_info', 'unsubscribed']) || 0;

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
        {renderNumeric(subscriberCount)}
      </TableCell>
      <TableCell>
        {renderPercentage(deliveryRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(openRate)}
      </TableCell>
      <TableCell>
        {renderPercentage(clickRate)}
      </TableCell>
      <TableCell>
        {renderNumeric(bounceCount)}
      </TableCell>
      <TableCell>
        {renderNumeric(unsubscribeCount)}
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
