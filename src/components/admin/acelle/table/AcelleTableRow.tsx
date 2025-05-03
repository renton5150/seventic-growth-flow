
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { translateStatus, getStatusBadgeVariant, renderPercentage } from "@/utils/acelle/campaignStatusUtils";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
}

export const AcelleTableRow = ({ 
  campaign, 
  account, 
  onViewCampaign, 
  demoMode = false 
}: AcelleTableRowProps) => {
  // Garantir la présence d'un UID valide
  const campaignUid = campaign?.uid || campaign?.campaign_uid || '';
  
  // Garantir des valeurs sûres pour les propriétés obligatoires
  const campaignName = campaign?.name || "Sans nom";
  const campaignSubject = campaign?.subject || "Sans sujet";
  const campaignStatus = (campaign?.status || "unknown").toLowerCase();
  
  // Date d'envoi avec fallback
  const deliveryDate = campaign?.delivery_date || campaign?.run_at || null;

  // Récupérer les statistiques directement de la campagne
  const statistics = campaign.statistics || {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };

  // Récupérer les delivery_info directement de la campagne
  const deliveryInfo = campaign.delivery_info || {
    total: 0,
    delivery_rate: 0,
    unique_open_rate: 0,
    click_rate: 0,
    bounce_rate: 0,
    unsubscribe_rate: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: { total: 0, soft: 0, hard: 0 },
    unsubscribed: 0,
    complained: 0
  };

  // Formatage sécurisé des dates
  const formatDateSafely = (dateString: string | null | undefined) => {
    if (!dateString) return "Non programmé";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Récupérer les statistiques formattées
  const getTotalSent = (): number => {
    return statistics?.subscriber_count || deliveryInfo?.total || 0;
  };

  const getOpenRate = (): number => {
    return statistics?.uniq_open_rate || statistics?.open_rate || 
      deliveryInfo?.unique_open_rate || 0;
  };

  const getClickRate = (): number => {
    return statistics?.click_rate || deliveryInfo?.click_rate || 0;
  };

  const getBounceCount = (): number => {
    if (statistics?.bounce_count !== undefined) return statistics.bounce_count;
    
    if (deliveryInfo?.bounced) {
      if (typeof deliveryInfo.bounced === 'object' && deliveryInfo.bounced.total !== undefined) {
        return deliveryInfo.bounced.total;
      }
      if (typeof deliveryInfo.bounced === 'number') {
        return deliveryInfo.bounced;
      }
    }
    
    return 0;
  };

  // Valeurs à afficher
  const totalSent = getTotalSent();
  const openRate = getOpenRate();
  const clickRate = getClickRate();
  const bounceCount = getBounceCount();
  
  const handleViewCampaign = () => {
    console.log(`Affichage des détails pour la campagne ${campaignUid}`, { campaign });
    onViewCampaign(campaignUid);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{campaignName}</TableCell>
      <TableCell>{campaignSubject}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(campaignStatus)}>
          {translateStatus(campaignStatus)}
        </Badge>
      </TableCell>
      <TableCell>{formatDateSafely(deliveryDate)}</TableCell>
      <TableCell className="font-medium tabular-nums">
        {totalSent.toLocaleString()}
      </TableCell>
      <TableCell className="tabular-nums">
        {renderPercentage(openRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {renderPercentage(clickRate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {bounceCount.toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleViewCampaign}
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
