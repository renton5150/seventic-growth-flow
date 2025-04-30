
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

  // Enhanced helper to safely render numeric values with graceful fallbacks
  const safeNumber = (value: any, fallbackSource?: any): number => {
    // Try the primary value first
    if (value !== undefined && value !== null) {
      const num = Number(value);
      if (!isNaN(num)) return num;
    }
    
    // If fallback source is provided, try that next
    if (fallbackSource !== undefined && fallbackSource !== null) {
      const num = Number(fallbackSource);
      if (!isNaN(num)) return num;
    }
    
    // Ultimate fallback
    return 0;
  };

  // Enhanced function to get statistic value with multiple fallbacks
  const getStatValue = (paths: string[][], campaign: AcelleCampaign): number => {
    for (const path of paths) {
      let value = campaign;
      for (const key of path) {
        if (value === undefined || value === null || typeof value !== 'object') {
          break;
        }
        value = value[key as keyof typeof value];
      }
      
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (!isNaN(num)) return num;
      }
    }
    return 0;
  };

  // Function to get rate with fallbacks
  const getRate = (
    primaryPath: string[][], 
    fallbackNumeratorPath: string[][], 
    fallbackDenominatorPath: string[][], 
    campaign: AcelleCampaign
  ): number => {
    // Try direct rate first
    const directRate = getStatValue(primaryPath, campaign);
    if (directRate > 0) return directRate;
    
    // Calculate from numerator and denominator
    const numerator = getStatValue(fallbackNumeratorPath, campaign);
    const denominator = getStatValue(fallbackDenominatorPath, campaign);
    
    if (denominator > 0) return (numerator / denominator) * 100;
    return 0;
  };

  // Get subscriber count with fallbacks
  const getSubscriberCount = (): number => {
    return getStatValue([
      ['delivery_info', 'total'], 
      ['statistics', 'subscriber_count'],
      ['statistics', 'delivered_count'],
      ['meta', 'subscribers_count']
    ], campaign);
  };

  // Get delivered count with fallbacks
  const getDeliveredCount = (): number => {
    return getStatValue([
      ['delivery_info', 'delivered'], 
      ['statistics', 'delivered_count']
    ], campaign);
  };

  // Get opened count with fallbacks
  const getOpenedCount = (): number => {
    return getStatValue([
      ['delivery_info', 'opened'], 
      ['statistics', 'open_count']
    ], campaign);
  };

  // Get clicked count with fallbacks
  const getClickedCount = (): number => {
    return getStatValue([
      ['delivery_info', 'clicked'], 
      ['statistics', 'click_count']
    ], campaign);
  };

  // Get bounced count with fallbacks
  const getBouncedCount = (): number => {
    return getStatValue([
      ['delivery_info', 'bounced', 'total'], 
      ['statistics', 'bounce_count']
    ], campaign);
  };

  // Get unsubscribed count with fallbacks
  const getUnsubscribedCount = (): number => {
    return getStatValue([
      ['delivery_info', 'unsubscribed'], 
      ['statistics', 'unsubscribe_count']
    ], campaign);
  };

  // Get delivery rate with fallbacks (delivered / total)
  const getDeliveryRate = (): number => {
    return getRate(
      [['delivery_info', 'delivery_rate'], ['statistics', 'delivered_rate']], 
      [['delivery_info', 'delivered'], ['statistics', 'delivered_count']], 
      [['delivery_info', 'total'], ['statistics', 'subscriber_count']], 
      campaign
    );
  };

  // Get open rate with fallbacks (opened / delivered)
  const getOpenRate = (): number => {
    return getRate(
      [['delivery_info', 'unique_open_rate'], ['statistics', 'uniq_open_rate']], 
      [['delivery_info', 'opened'], ['statistics', 'open_count']], 
      [['delivery_info', 'delivered'], ['statistics', 'delivered_count']], 
      campaign
    );
  };

  // Get click rate with fallbacks (clicked / delivered)
  const getClickRate = (): number => {
    return getRate(
      [['delivery_info', 'click_rate'], ['statistics', 'click_rate']], 
      [['delivery_info', 'clicked'], ['statistics', 'click_count']], 
      [['delivery_info', 'delivered'], ['statistics', 'delivered_count']], 
      campaign
    );
  };

  // Get bounce rate with fallbacks (bounced / total)
  const getBounceRate = (): number => {
    return getRate(
      [['delivery_info', 'bounce_rate']], 
      [['delivery_info', 'bounced', 'total'], ['statistics', 'bounce_count']], 
      [['delivery_info', 'total'], ['statistics', 'subscriber_count']], 
      campaign
    );
  };

  // Get unsubscribe rate with fallbacks (unsubscribed / delivered)
  const getUnsubscribeRate = (): number => {
    return getRate(
      [['delivery_info', 'unsubscribe_rate']], 
      [['delivery_info', 'unsubscribed'], ['statistics', 'unsubscribe_count']], 
      [['delivery_info', 'delivered'], ['statistics', 'delivered_count']], 
      campaign
    );
  };

  // Add extensive debugging
  const debugStats = {
    name: campaign.name,
    stats: {
      subscriber_count: getSubscriberCount(),
      delivered: getDeliveredCount(),
      delivery_rate: getDeliveryRate(),
      opened: getOpenedCount(),
      open_rate: getOpenRate(),
      clicked: getClickedCount(),
      click_rate: getClickRate(),
      bounced: getBouncedCount(),
      bounce_rate: getBounceRate(),
      unsubscribed: getUnsubscribedCount(),
      unsubscribe_rate: getUnsubscribeRate()
    },
    raw_data: {
      delivery_info: campaign.delivery_info,
      statistics: campaign.statistics,
      delivery_date: campaign.delivery_date,
      run_at: campaign.run_at
    }
  };

  // Log complete stats only once per component lifecycle using a ref
  React.useEffect(() => {
    console.log(`Campaign Stats Debug for ${campaign.name}:`, debugStats);
  }, [campaign.uid]);

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
        {getSubscriberCount()}
      </TableCell>
      <TableCell>
        <div>
          <div>{getDeliveredCount()}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(getDeliveryRate())}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{getOpenedCount()}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(getOpenRate())}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{getClickedCount()}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(getClickRate())}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{getBouncedCount()}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(getBounceRate())}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{getUnsubscribedCount()}</div>
          <div className="text-xs text-muted-foreground">
            {renderPercentage(getUnsubscribeRate())}
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
};
