
import React from "react";
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { AlertTriangle } from "lucide-react";

interface CampaignGlobalStatsProps {
  statistics: AcelleCampaignStatistics;
  isSimulated?: boolean;
}

export const CampaignGlobalStats = ({ 
  statistics,
  isSimulated = false
}: CampaignGlobalStatsProps) => {
  // Formatage des nombres
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  // Formatage des pourcentages
  const formatPercentage = (value?: number): string => {
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  // Récupération des valeurs importantes
  const total = statistics?.subscriber_count || 0;
  const delivered = statistics?.delivered_count || 0;
  const opened = statistics?.open_count || 0;
  const clicked = statistics?.click_count || 0;
  const bounces = statistics?.bounce_count || 0;
  const unsubscribed = statistics?.unsubscribe_count || 0;

  // Calcul des taux si nécessaire
  const deliveryRate = statistics?.delivered_rate || (total > 0 ? (delivered / total) * 100 : 0);
  const openRate = statistics?.uniq_open_rate || (delivered > 0 ? (opened / delivered) * 100 : 0);
  const clickRate = statistics?.click_rate || (delivered > 0 ? (clicked / delivered) * 100 : 0);

  return (
    <div className="relative">
      <h3 className="font-medium mb-2 flex items-center">
        Statistiques globales
        {isSimulated && (
          <span className="ml-2 inline-flex items-center text-xs text-amber-600 rounded-full">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Simulées
          </span>
        )}
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Destinataires:</span>
          <span className="font-medium">{formatNumber(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Délivrés:</span>
          <span>{formatNumber(delivered)} ({formatPercentage(deliveryRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ouvertures:</span>
          <span>{formatNumber(opened)} ({formatPercentage(openRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Clics:</span>
          <span>{formatNumber(clicked)} ({formatPercentage(clickRate)})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bounces:</span>
          <span>{formatNumber(bounces)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Désabonnements:</span>
          <span>{formatNumber(unsubscribed)}</span>
        </div>
      </div>
    </div>
  );
};
