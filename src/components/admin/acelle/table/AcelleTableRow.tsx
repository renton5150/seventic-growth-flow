
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { formatDate } from "@/lib/date";
import { Eye } from "lucide-react";
import { translateStatus } from "@/utils/acelle/campaignStats";

interface AcelleTableRowProps {
  campaign: AcelleCampaign;
  account?: AcelleAccount;
  onViewCampaign: (uid: string) => void;
  demoMode?: boolean;
  forceReload?: boolean;
}

export const AcelleTableRow = ({
  campaign,
  account,
  onViewCampaign,
  demoMode = false,
}: AcelleTableRowProps) => {
  // Fonction pour obtenir les statistiques de la campagne
  const getStatistics = () => {
    if (campaign.statistics) {
      return campaign.statistics;
    }
    
    // Fallback vers delivery_info
    if (campaign.delivery_info) {
      const info = typeof campaign.delivery_info === 'string' 
        ? JSON.parse(campaign.delivery_info) 
        : campaign.delivery_info;
        
      return {
        subscriber_count: info.total || 0,
        delivered_count: info.delivered || 0,
        open_count: info.opened || 0,
        click_count: info.clicked || 0,
        bounce_count: info.bounced?.total || 0,
        uniq_open_rate: info.unique_open_rate || 0,
        click_rate: info.click_rate || 0
      };
    }
    
    // Si aucune statistique n'est disponible, retourner des valeurs par défaut
    return {
      subscriber_count: 0,
      delivered_count: 0,
      open_count: 0,
      click_count: 0,
      bounce_count: 0,
      uniq_open_rate: 0,
      click_rate: 0
    };
  };
  
  // Récupérer les statistiques
  const statistics = getStatistics();
  
  // Formater les taux en pourcentage
  const formatRate = (rate: number) => {
    if (!rate && rate !== 0) return "N/A";
    return `${(rate * 100).toFixed(1)}%`;
  };
  
  // Obtenir la date d'envoi formatée
  const deliveryDate = campaign.delivery_date || campaign.run_at;
  
  // Gérer le clic sur le bouton de visualisation
  const handleViewClick = () => {
    const uid = campaign.uid || campaign.campaign_uid;
    if (uid) {
      onViewCampaign(uid);
    }
  };
  
  return (
    <TableRow key={campaign.uid || campaign.campaign_uid}>
      <TableCell className="font-medium">{campaign.name}</TableCell>
      <TableCell>{campaign.subject}</TableCell>
      <TableCell>
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
          {translateStatus(campaign.status)}
        </div>
      </TableCell>
      <TableCell>{deliveryDate ? formatDate(deliveryDate) : "—"}</TableCell>
      <TableCell>{statistics.subscriber_count || 0}</TableCell>
      <TableCell>{formatRate(statistics.uniq_open_rate || 0)}</TableCell>
      <TableCell>{formatRate(statistics.click_rate || 0)}</TableCell>
      <TableCell>{statistics.bounce_count || 0}</TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={handleViewClick}>
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
