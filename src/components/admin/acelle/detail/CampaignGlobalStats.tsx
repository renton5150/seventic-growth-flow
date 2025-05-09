
import React from "react";
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { 
  formatNumberSafely, 
  renderPercentage, 
  extractOpenRate, 
  extractClickRate 
} from "@/utils/acelle/campaignStatusUtils";

interface CampaignGlobalStatsProps {
  statistics: AcelleCampaignStatistics;
}

export const CampaignGlobalStats = ({ statistics }: CampaignGlobalStatsProps) => {
  // Debug des données reçues
  console.log("[CampaignGlobalStats] Statistics received:", {
    raw: statistics,
    keys: Object.keys(statistics || {}),
    openRate: statistics?.uniq_open_rate || 'Non défini',
    clickRate: statistics?.click_rate || 'Non défini'
  });

  // Récupération des valeurs importantes
  const total = parseFloat(String(statistics?.subscriber_count || 0));
  const delivered = parseFloat(String(statistics?.delivered_count || 0));
  const opened = parseFloat(String(statistics?.open_count || 0));
  const clicked = parseFloat(String(statistics?.click_count || 0));
  const bounces = parseFloat(String(statistics?.bounce_count || 0));
  const unsubscribed = parseFloat(String(statistics?.unsubscribe_count || 0));

  // Utilisation de nos fonctions d'extraction robustes
  const openRate = extractOpenRate(statistics);
  const clickRate = extractClickRate(statistics);
  
  // Calcul du taux de livraison
  let deliveryRate = 0;
  if (statistics?.delivered_rate !== undefined) {
    deliveryRate = parseFloat(String(statistics.delivered_rate));
  } else if (total > 0) {
    deliveryRate = (delivered / total) * 100;
  }

  return (
    <div>
      <h3 className="font-medium mb-2">Statistiques globales</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Destinataires:</span>
          <span className="font-medium">{formatNumberSafely(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Délivrés:</span>
          <span>{formatNumberSafely(delivered)} ({renderPercentage(deliveryRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ouvertures:</span>
          <span>{formatNumberSafely(opened)} ({renderPercentage(openRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Clics:</span>
          <span>{formatNumberSafely(clicked)} ({renderPercentage(clickRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bounces:</span>
          <span>{formatNumberSafely(bounces)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Désabonnements:</span>
          <span>{formatNumberSafely(unsubscribed)}</span>
        </div>
      </div>
    </div>
  );
};
