
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  formatNumberSafely, 
  renderPercentage, 
  extractOpenRate,
  extractClickRate
} from "@/utils/acelle/campaignStatusUtils";

interface CampaignStatisticsProps {
  statistics: AcelleCampaignStatistics;
  loading?: boolean;
}

export const CampaignStatistics = ({ statistics, loading = false }: CampaignStatisticsProps) => {
  // Debug les valeurs des statistiques
  console.log("[CampaignStatistics] Statistiques reçues:", {
    statisticsObj: statistics,
    keys: Object.keys(statistics || {}),
    openRate: statistics?.uniq_open_rate || 'Non défini',
    clickRate: statistics?.click_rate || 'Non défini',
    delivered: statistics?.delivered_count || 'Non défini',
    total: statistics?.subscriber_count || 'Non défini'
  });

  // Récupération des valeurs importantes et conversion en nombres
  const total = parseFloat(String(statistics?.subscriber_count || 0));
  const delivered = parseFloat(String(statistics?.delivered_count || 0));
  const opened = parseFloat(String(statistics?.open_count || statistics?.uniq_open_count || 0));
  const clicked = parseFloat(String(statistics?.click_count || 0));
  const bounces = parseFloat(String(statistics?.bounce_count || 0));
  const softBounces = parseFloat(String(statistics?.soft_bounce_count || 0));
  const hardBounces = parseFloat(String(statistics?.hard_bounce_count || 0));
  const unsubscribed = parseFloat(String(statistics?.unsubscribe_count || 0));
  const complained = parseFloat(String(statistics?.abuse_complaint_count || 0));

  // Utiliser nos fonctions d'extraction robustes
  const openRate = extractOpenRate(statistics);
  const clickRate = extractClickRate(statistics);
  
  // Calcul du taux de livraison
  let deliveryRate = 0;
  if (statistics?.delivered_rate !== undefined) {
    deliveryRate = parseFloat(String(statistics.delivered_rate));
  } else if (total > 0) {
    deliveryRate = (delivered / total) * 100;
  }

  // Afficher un état de chargement ou un message d'absence de données si nécessaire
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-muted/10">
        <p className="text-xl font-medium text-muted-foreground">Aucune statistique disponible pour cette campagne</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les statistiques seront disponibles une fois la campagne envoyée et les données synchronisées.
        </p>
      </div>
    );
  }

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
              {renderPercentage(deliveryRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumberSafely(delivered)} sur {formatNumberSafely(total)} emails délivrés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderPercentage(openRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumberSafely(opened)} emails ouverts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderPercentage(clickRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumberSafely(clicked)} clics enregistrés
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
                <span className="font-medium">{formatNumberSafely(bounces)}</span>
              </div>
              <div className="flex justify-between">
                <span>Soft bounces:</span>
                <span>{formatNumberSafely(softBounces)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hard bounces:</span>
                <span>{formatNumberSafely(hardBounces)}</span>
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
                <span className="font-medium">{formatNumberSafely(unsubscribed)}</span>
              </div>
              <div className="flex justify-between">
                <span>Plaintes:</span>
                <span>{formatNumberSafely(complained)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affichage des données brutes pour le débogage */}
      {process.env.NODE_ENV !== 'production' && (
        <details className="mt-8 p-4 border rounded-lg">
          <summary className="cursor-pointer text-sm text-muted-foreground">Données brutes (debug)</summary>
          <pre className="mt-2 p-4 bg-muted/10 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(statistics, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
