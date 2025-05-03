
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AcelleCampaignStatistics } from "@/types/acelle.types";

interface CampaignStatisticsProps {
  statistics: AcelleCampaignStatistics;
  loading?: boolean;
}

export const CampaignStatistics = ({ statistics, loading = false }: CampaignStatisticsProps) => {
  // Formatage des nombres
  const formatNumber = (value?: number): string => {
    if (loading) return "...";
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  // Formatage des pourcentages
  const formatPercentage = (value?: number): string => {
    if (loading) return "...";
    if (value === undefined || value === null) return "0%";
    return `${value.toFixed(1)}%`;
  };

  // Récupération des valeurs importantes
  const total = statistics?.subscriber_count || 0;
  const delivered = statistics?.delivered_count || 0;
  const opened = statistics?.open_count || 0;
  const clicked = statistics?.click_count || 0;
  const bounces = statistics?.bounce_count || 0;
  const softBounces = statistics?.soft_bounce_count || 0;
  const hardBounces = statistics?.hard_bounce_count || 0;
  const unsubscribed = statistics?.unsubscribe_count || 0;
  const complained = statistics?.abuse_complaint_count || 0;

  // Calcul des taux si nécessaire
  const deliveryRate = statistics?.delivered_rate || (total > 0 ? (delivered / total) * 100 : 0);
  const openRate = statistics?.uniq_open_rate || statistics?.open_rate || 
    (delivered > 0 ? (opened / delivered) * 100 : 0);
  const clickRate = statistics?.click_rate || (delivered > 0 ? (clicked / delivered) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Cartes des métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Délivrabilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(deliveryRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(delivered)} sur {formatNumber(total)} emails délivrés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(openRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(opened)} emails ouverts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(clickRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(clicked)} clics enregistrés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cartes détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des bounces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Bounces totaux:</span>
                <span className="font-medium">{formatNumber(bounces)}</span>
              </div>
              <div className="flex justify-between">
                <span>Soft bounces:</span>
                <span>{formatNumber(softBounces)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hard bounces:</span>
                <span>{formatNumber(hardBounces)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autres métriques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Désabonnements:</span>
                <span className="font-medium">{formatNumber(unsubscribed)}</span>
              </div>
              <div className="flex justify-between">
                <span>Plaintes:</span>
                <span>{formatNumber(complained)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
