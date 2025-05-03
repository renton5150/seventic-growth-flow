
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { Badge } from "@/components/ui/badge";
import { translateStatus, getStatusBadgeVariant, generateSimulatedStats } from "@/utils/acelle/campaignStatusUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCampaignStatsDirectly } from "@/services/acelle/api/directStats";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";

interface AcelleCampaignDetailsProps {
  campaignId: string;
  account: AcelleAccount;
  onClose: () => void;
  demoMode?: boolean;
}

const AcelleCampaignDetails = ({ 
  campaignId, 
  account, 
  onClose,
  demoMode = false
}: AcelleCampaignDetailsProps) => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (demoMode) {
          // En mode démo, créer une campagne factice
          const demoCampaign = createDemoCampaign(campaignId);
          setCampaign(demoCampaign);
          const demoStats = generateSimulatedStats();
          setStats(demoStats.delivery_info);
        } else {
          // Charger depuis le cache
          const campaigns = await fetchCampaignsFromCache([account]);
          const foundCampaign = campaigns.find(
            c => c.uid === campaignId || c.campaign_uid === campaignId
          );
          
          if (foundCampaign) {
            setCampaign(foundCampaign);
            console.log(`Campagne trouvée: ${foundCampaign.name}`, foundCampaign);
            
            // Récupérer les statistiques à jour
            try {
              console.log(`Récupération des statistiques pour la campagne ${campaignId}`);
              const freshStats = await getCampaignStatsDirectly(foundCampaign, account);
              console.log("Statistiques récupérées:", freshStats);
              
              // Utiliser les nouvelles statistiques ou celles déjà présentes
              if (freshStats && Object.keys(freshStats).length > 0) {
                if (freshStats.delivery_info) {
                  setStats(freshStats.delivery_info);
                } else if (freshStats.statistics) {
                  setStats(freshStats.statistics);
                } else {
                  setStats(freshStats);
                }
              } else if (foundCampaign.delivery_info && Object.keys(foundCampaign.delivery_info).length > 0) {
                setStats(foundCampaign.delivery_info);
              } else if (foundCampaign.statistics && Object.keys(foundCampaign.statistics).length > 0) {
                setStats(foundCampaign.statistics);
              }
            } catch (err) {
              console.error("Erreur lors de la récupération des statistiques:", err);
              // En cas d'erreur, utiliser les stats existantes
              if (foundCampaign.delivery_info) {
                setStats(foundCampaign.delivery_info);
              } else if (foundCampaign.statistics) {
                setStats(foundCampaign.statistics);
              }
            }
          } else {
            setError("Campagne non trouvée");
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account, demoMode]);

  // Créer une campagne fictive pour le mode démo
  const createDemoCampaign = (id: string): AcelleCampaign => {
    const now = new Date();
    return {
      uid: id,
      campaign_uid: id,
      name: "Campagne démo détaillée",
      subject: "Sujet de la campagne démo détaillée",
      status: "sent",
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
      delivery_date: now.toISOString(),
      run_at: null,
      last_error: null,
      delivery_info: {}
    };
  };

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

  // Formatage des dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Non définie";
    
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  useEffect(() => {
    // Log des statistiques pour le débogage
    console.log("Statistiques disponibles pour la campagne détaillée:", stats);
    console.log("Campaign object:", campaign);
  }, [stats, campaign]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Erreur: {error || "Campagne non trouvée"}</p>
      </div>
    );
  }

  // Extraction des statistiques
  const getStatValue = (key: string, defaultValue: number = 0): number => {
    if (!stats) return defaultValue;
    
    if (typeof stats[key] === 'number') {
      return stats[key];
    }
    
    // Recherche de mappages alternatifs
    const mappings: Record<string, string[]> = {
      'total': ['subscriber_count', 'recipients_count'],
      'delivered': ['delivered_count'],
      'opened': ['open_count'],
      'clicked': ['click_count'],
      'delivery_rate': ['delivered_rate'],
      'unique_open_rate': ['open_rate', 'uniq_open_rate'],
      'click_rate': ['click_rate']
    };
    
    if (mappings[key]) {
      for (const altKey of mappings[key]) {
        if (typeof stats[altKey] === 'number') {
          return stats[altKey];
        }
      }
    }
    
    // Gestion spéciale pour bounced
    if (key === 'bounced' || key === 'total_bounces') {
      if (typeof stats.bounced === 'object' && stats.bounced) {
        return stats.bounced.total || defaultValue;
      }
      if (typeof stats.bounced === 'number') {
        return stats.bounced;
      }
      if (typeof stats.bounce_count === 'number') {
        return stats.bounce_count;
      }
    }
    
    return defaultValue;
  };

  // Valeurs statistiques avec extraction fiable
  const total = getStatValue('total');
  const delivered = getStatValue('delivered');
  const opened = getStatValue('opened');
  const clicked = getStatValue('clicked');
  const totalBounces = getStatValue('bounced');
  const softBounces = stats && stats.bounced && typeof stats.bounced === 'object' ? 
    (stats.bounced.soft || 0) : 0;
  const hardBounces = stats && stats.bounced && typeof stats.bounced === 'object' ? 
    (stats.bounced.hard || 0) : 0;
  const unsubscribed = getStatValue('unsubscribed');
  const complained = getStatValue('complained');
  const delivery_rate = getStatValue('delivery_rate');
  const open_rate = getStatValue('unique_open_rate');
  const click_rate = getStatValue('click_rate');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Informations générales</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom:</span>
              <span className="font-medium">{campaign.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sujet:</span>
              <span>{campaign.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {translateStatus(campaign.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Créée le:</span>
              <span>{formatDate(campaign.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envoyée le:</span>
              <span>{formatDate(campaign.delivery_date)}</span>
            </div>
            {campaign.last_error && (
              <div className="flex justify-between">
                <span className="text-gray-600">Erreur:</span>
                <span className="text-red-500">{campaign.last_error}</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Statistiques globales</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Destinataires:</span>
              <span className="font-medium">{formatNumber(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Délivrés:</span>
              <span>{formatNumber(delivered)} ({formatPercentage(delivery_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ouvertures:</span>
              <span>{formatNumber(opened)} ({formatPercentage(open_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clics:</span>
              <span>{formatNumber(clicked)} ({formatPercentage(click_rate)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bounces:</span>
              <span>{formatNumber(totalBounces)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Désabonnements:</span>
              <span>{formatNumber(unsubscribed)}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
          <TabsTrigger value="links">Liens et clics</TabsTrigger>
          <TabsTrigger value="technical">Informations techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Délivrabilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(delivery_rate)}
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
                  {formatPercentage(open_rate)}
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
                  {formatPercentage(click_rate)}
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
                    <span className="font-medium">{formatNumber(totalBounces)}</span>
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
        </TabsContent>

        <TabsContent value="links" className="py-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">
                Les données détaillées sur les clics ne sont pas disponibles pour le moment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Données techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {campaign.uid || campaign.campaign_uid}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière mise à jour:</span>
                  <span>{formatDate(campaign.updated_at)}</span>
                </div>
                {campaign.run_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date planifiée:</span>
                    <span>{formatDate(campaign.run_at)}</span>
                  </div>
                )}
              </div>
              
              {demoMode && (
                <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md">
                  Mode démonstration activé : les données affichées sont simulées.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
