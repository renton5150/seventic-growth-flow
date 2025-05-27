import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, Zap, Turtle, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CampaignStatisticsProps {
  statistics: AcelleCampaignStatistics | null | undefined;
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string | null;
  // Nouvelles props pour les métriques de performance
  isSlowApi?: boolean;
  isVerySlowApi?: boolean;
  averageResponseTime?: number;
  timeoutUsed?: number;
  consecutiveSlowRequests?: number;
}

export const CampaignStatistics = ({ 
  statistics, 
  loading = false,
  onRefresh,
  lastUpdated,
  isSlowApi = false,
  isVerySlowApi = false,
  averageResponseTime,
  timeoutUsed,
  consecutiveSlowRequests = 0
}: CampaignStatisticsProps) => {
  // Formatage des nombres
  const formatNumber = (value?: number | null): string => {
    if (loading) return "...";
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  const formatPercentage = (value?: number | null): string => {
    if (loading) return "...";
    if (value === undefined || value === null) return "0%";
    
    if (value > 1) {
      return `${value.toFixed(1)}%`;
    }
    
    return `${(value * 100).toFixed(1)}%`;
  };

  // Récupération des valeurs importantes avec fallbacks robustes
  const total = statistics?.subscriber_count || 0;
  const delivered = statistics?.delivered_count || 0;
  const opened = statistics?.open_count || statistics?.uniq_open_count || 0;
  const clicked = statistics?.click_count || 0;
  const bounces = statistics?.bounce_count || 0;
  const softBounces = statistics?.soft_bounce_count || 0;
  const hardBounces = statistics?.hard_bounce_count || 0;
  const unsubscribed = statistics?.unsubscribe_count || 0;
  const complained = statistics?.abuse_complaint_count || 0;

  const deliveryRate = statistics?.delivered_rate || (total > 0 ? (delivered / total) * 100 : 0);
  const openRate = statistics?.uniq_open_rate || statistics?.open_rate || 
    (delivered > 0 ? (opened / delivered) * 100 : 0);
  const clickRate = statistics?.click_rate || (delivered > 0 ? (clicked / delivered) * 100 : 0);
  
  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    try {
      const date = new Date(lastUpdated);
      return `Mise à jour le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
    } catch (e) {
      return null;
    }
  };
  
  const lastUpdatedText = formatLastUpdated();

  const isStatsEmpty = !statistics || (!statistics.subscriber_count && !statistics.delivered_count && !statistics.open_count && !statistics.click_count);

  // Composant pour afficher les métriques de performance améliorées
  const PerformanceIndicators = () => {
    if (!averageResponseTime && !timeoutUsed && !isSlowApi) return null;

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {isVerySlowApi && (
          <Badge variant="destructive" className="gap-1">
            <Turtle className="h-3 w-3" />
            API Très Lente
          </Badge>
        )}
        {isSlowApi && !isVerySlowApi && (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
            <AlertTriangle className="h-3 w-3" />
            API Lente
          </Badge>
        )}
        {!isSlowApi && averageResponseTime && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3" />
            API Normale
          </Badge>
        )}
        {averageResponseTime && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {Math.round(averageResponseTime / 1000)}s moy.
          </Badge>
        )}
        {timeoutUsed && (
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Timeout: {Math.round(timeoutUsed / 1000)}s
          </Badge>
        )}
        {consecutiveSlowRequests > 0 && (
          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
            <AlertTriangle className="h-3 w-3" />
            {consecutiveSlowRequests} req. lentes
          </Badge>
        )}
      </div>
    );
  };

  // Alerte pour les API très lentes
  const SlowApiAlert = () => {
    if (!isVerySlowApi && consecutiveSlowRequests < 3) return null;

    return (
      <Alert variant="destructive" className="mb-4">
        <Turtle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Plateforme Acelle très lente détectée</div>
          <div className="text-sm mt-1">
            Cette plateforme répond très lentement ({Math.round((averageResponseTime || 0) / 1000)}s en moyenne).
            {consecutiveSlowRequests >= 3 && " Plusieurs tentatives consécutives ont été lentes."}
            <br />
            <strong>Recommandations :</strong> Vérifiez la connexion réseau de votre serveur Acelle Mail ou contactez votre administrateur.
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de rafraîchissement et métriques de performance */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {lastUpdatedText && (
            <p className="text-xs text-muted-foreground">{lastUpdatedText}</p>
          )}
          <PerformanceIndicators />
        </div>
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            size="sm" 
            variant="outline" 
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Rafraîchir les statistiques'}
          </Button>
        )}
      </div>
      
      {/* Alerte pour les API très lentes */}
      <SlowApiAlert />
      
      {/* Message si les statistiques sont vides avec info sur l'API lente */}
      {isStatsEmpty && !loading && (
        <div className={`p-4 border rounded-md ${
          isVerySlowApi ? 'bg-red-50 text-red-800 border-red-200' : 
          isSlowApi ? 'bg-amber-50 text-amber-800 border-amber-200' : 
          'bg-blue-50 text-blue-800 border-blue-200'
        } mb-4`}>
          <div className="flex items-start gap-2">
            {isVerySlowApi ? <Turtle className="h-4 w-4 mt-0.5" /> : 
             isSlowApi ? <AlertTriangle className="h-4 w-4 mt-0.5" /> : 
             <RefreshCw className="h-4 w-4 mt-0.5" />}
            <div>
              <p className="text-sm font-medium">
                {isVerySlowApi ? 'API très lente détectée' : 
                 isSlowApi ? 'API lente détectée' : 
                 'Aucune statistique disponible'}
              </p>
              <p className="text-xs mt-1">
                {isVerySlowApi 
                  ? 'Cette plateforme Acelle est extrêmement lente. Le chargement peut prendre plusieurs minutes. Vérifiez la configuration serveur.'
                  : isSlowApi 
                    ? 'Cette plateforme Acelle est plus lente que la moyenne. Le chargement peut prendre plus de temps.'
                    : 'Cliquez sur "Rafraîchir les statistiques" pour récupérer les dernières données.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
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
