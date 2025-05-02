
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
          setStats(generateSimulatedStats());
        } else {
          // Charger depuis le cache
          const campaigns = await fetchCampaignsFromCache([account]);
          const foundCampaign = campaigns.find(
            c => c.uid === campaignId || c.campaign_uid === campaignId
          );
          
          if (foundCampaign) {
            setCampaign(foundCampaign);
            
            // Récupérer les statistiques à jour
            const freshStats = await getCampaignStatsDirectly(foundCampaign, account);
            setStats(freshStats);
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
  const statsData = stats || campaign.delivery_info || campaign.statistics || {};
  const { 
    total = 0,
    delivered = 0, 
    opened = 0, 
    clicked = 0, 
    bounced = { total: 0 },
    unsubscribed = 0,
    complained = 0,
    delivery_rate = 0,
    open_rate = 0,
    click_rate = 0
  } = statsData;

  const totalBounces = typeof bounced === 'object' ? bounced.total : bounced;
  const softBounces = typeof bounced === 'object' ? bounced.soft : 0;
  const hardBounces = typeof bounced === 'object' ? bounced.hard : 0;

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
