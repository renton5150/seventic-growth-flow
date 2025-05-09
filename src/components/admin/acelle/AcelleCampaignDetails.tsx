import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { fetchCampaignsFromCache, fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { fetchDirectStatistics } from "@/services/acelle/api/stats/directStats";
import { ensureValidStatistics } from "@/services/acelle/api/stats/validation";
import { toast } from "sonner";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";
import { buildDirectApiUrl } from "@/services/acelle/acelle-service";

// Composants réutilisables
import { CampaignStatistics } from "./stats/CampaignStatistics";
import { CampaignGeneralInfo } from "./detail/CampaignGeneralInfo";
import { CampaignGlobalStats } from "./detail/CampaignGlobalStats";
import { CampaignTechnicalInfo } from "./detail/CampaignTechnicalInfo";

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
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'demo' | null>(null);

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (demoMode) {
          // Mode démo: créer une campagne factice avec des statistiques
          const { campaignData, statsData } = await loadDemoCampaign(campaignId);
          setCampaign(campaignData);
          setStats(statsData);
          setLastUpdated(new Date().toISOString());
          setDataSource('demo');
        } else {
          // Mode normal: essayer de charger depuis le cache puis directement depuis l'API si nécessaire
          await loadRealCampaign(campaignId, account);
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

  // Fonction pour charger une campagne réelle avec tentatives multiples
  const loadRealCampaign = async (id: string, acct: AcelleAccount) => {
    console.log(`Récupération des informations pour la campagne ${id}`);
    
    try {
      // 1. Essayer de trouver la campagne dans le cache en mémoire
      const campaigns = await fetchCampaignsFromCache([acct]);
      let foundCampaign = campaigns.find(c => c.uid === id || c.campaign_uid === id);
      
      // 2. Si non trouvée, chercher directement dans la base de données
      if (!foundCampaign) {
        console.log(`Campagne ${id} non trouvée en cache, recherche dans la base de données`);
        
        // Utiliser la fonction fetchCampaignById pour récupérer les données
        foundCampaign = await fetchCampaignById(id, acct.id);
        
        if (!foundCampaign) {
          throw new Error("Impossible de récupérer les détails de la campagne");
        }
        
        console.log(`Campagne ${foundCampaign.name} trouvée dans la base de données`, foundCampaign);
      }
      
      if (foundCampaign) {
        console.log(`Campagne trouvée: ${foundCampaign.name}`, foundCampaign);
        setCampaign(foundCampaign);
        
        // Si la campagne a déjà des statistiques valides dans le cache, les utiliser
        if (foundCampaign.statistics && foundCampaign.statistics.subscriber_count > 0) {
          console.log("Utilisation des statistiques du cache");
          setStats(foundCampaign.statistics);
          setDataSource('cache');
          setLastUpdated(foundCampaign.updated_at || new Date().toISOString());
        } else {
          // Sinon, récupérer les statistiques directement depuis l'API
          console.log("Statistiques manquantes ou incomplètes, récupération depuis l'API...");
          await refreshStatistics(foundCampaign.uid || foundCampaign.campaign_uid || id, acct);
        }
      } else {
        setError("Campagne non trouvée");
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la campagne:", err);
      
      // Essai de récupération directe des informations de campagne depuis l'API
      try {
        console.log("Tentative de récupération directe depuis l'API Acelle");
        toast.loading("Tentative de récupération directe depuis l'API...");
        
        // Construire l'URL pour obtenir les détails de la campagne directement
        const campaignUrl = buildDirectApiUrl(`campaigns/${id}`, account.api_endpoint, { api_token: account.api_token });
        
        // Récupérer les informations de base de la campagne
        const response = await fetch(campaignUrl, {
          headers: {
            'Accept': 'application/json',
            'x-acelle-token': account.api_token,
            'x-acelle-endpoint': account.api_endpoint
          }
        });
        
        if (!response.ok) {
          throw new Error(`API a retourné ${response.status}: ${response.statusText}`);
        }
        
        const campaignData = await response.json();
        if (campaignData) {
          console.log("Informations de campagne récupérées directement depuis l'API", campaignData);
          
          // Créer un objet de campagne à partir des données API
          const apiCampaign: AcelleCampaign = {
            uid: campaignData.uid || id,
            campaign_uid: campaignData.uid || id,
            name: campaignData.name || "Sans nom",
            subject: campaignData.subject || "",
            status: campaignData.status || "unknown",
            created_at: campaignData.created_at || new Date().toISOString(),
            updated_at: campaignData.updated_at || new Date().toISOString(),
            delivery_date: campaignData.run_at || null,
            run_at: campaignData.run_at || null,
            last_error: null,
            statistics: null,
            delivery_info: {}
          };
          
          setCampaign(apiCampaign);
          toast.success("Campagne récupérée directement depuis l'API");
          
          // Récupérer les statistiques
          await refreshStatistics(id, acct);
        } else {
          throw new Error("Aucune donnée retournée par l'API");
        }
      } catch (apiErr) {
        console.error("Échec de la récupération directe:", apiErr);
        setError(apiErr instanceof Error ? apiErr.message : "Erreur lors du chargement de la campagne");
        toast.error("Échec de la récupération directe");
      }
    }
  };

  // Fonction pour rafraîchir les statistiques
  const refreshStatistics = async (campaignUid: string, acct: AcelleAccount) => {
    if (!campaignUid) {
      toast.error("Identifiant de campagne manquant");
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      toast.loading("Récupération des statistiques...", { id: "stats-refresh" });
      console.log(`Récupération des statistiques fraîches pour la campagne ${campaignUid}`);
      
      // Récupérer les statistiques directement depuis l'API
      const freshStats = await fetchDirectStatistics(campaignUid, acct);
      
      if (freshStats) {
        // Normaliser les statistiques
        const validStats = ensureValidStatistics(freshStats);
        setStats(validStats);
        setDataSource('api');
        
        // Mettre à jour la campagne
        if (campaign) {
          setCampaign({
            ...campaign,
            statistics: validStats
          });
        }
        
        // Enregistrer l'heure de mise à jour
        setLastUpdated(new Date().toISOString());
        
        toast.success("Statistiques mises à jour avec succès", { id: "stats-refresh" });
      } else {
        toast.error("Impossible de récupérer les statistiques", { id: "stats-refresh" });
        console.error("Aucune statistique retournée par l'API");
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des statistiques", { id: "stats-refresh" });
      console.error("Erreur lors du rafraîchissement des statistiques:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fonction pour générer une campagne de démonstration
  const loadDemoCampaign = async (id: string) => {
    const now = new Date();
    
    // Créer la campagne
    const campaignData: AcelleCampaign = {
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
      statistics: null,
      delivery_info: {}
    };
    
    // Générer des statistiques
    const enrichedCampaign = await fetchAndProcessCampaignStats(campaignData, null!, { demoMode: true }) as AcelleCampaign;
    
    // Attribuer les statistiques à la campagne
    const statistics = enrichedCampaign.statistics || null;
    campaignData.statistics = statistics;
    
    return { campaignData, statsData: statistics };
  };

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error || !campaign) {
    return (
      <div className="text-center p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="mt-2">
            {error || "Campagne non trouvée"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Utiliser les statistiques de la campagne ou créer un objet vide
  const campaignStats = stats || campaign.statistics || {
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
  
  // Fonction pour gérer le rafraîchissement manuel des statistiques
  const handleRefresh = () => {
    refreshStatistics(campaign.uid || campaign.campaign_uid || campaignId, account);
  };

  return (
    <div className="space-y-6">
      {dataSource && (
        <Alert variant={dataSource === 'api' ? "default" : "destructive"} className={
          dataSource === 'api' 
            ? "bg-green-50 border-green-200" 
            : dataSource === 'cache' 
              ? "bg-amber-50 border-amber-200" 
              : "bg-blue-50 border-blue-200"
        }>
          <Info className="h-5 w-5" />
          <AlertDescription className="ml-2">
            {dataSource === 'api' 
              ? "Données récupérées directement depuis l'API Acelle" 
              : dataSource === 'cache' 
                ? "Données récupérées depuis le cache local (peuvent ne pas être à jour)"
                : "Données de démonstration (non réelles)"}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampaignGeneralInfo campaign={campaign} />
        <CampaignGlobalStats statistics={campaignStats} />
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
          <TabsTrigger value="links">Liens et clics</TabsTrigger>
          <TabsTrigger value="technical">Informations techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 py-4">
          <CampaignStatistics 
            statistics={campaignStats} 
            loading={isRefreshing} 
            onRefresh={handleRefresh}
            lastUpdated={lastUpdated}
          />
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
          <CampaignTechnicalInfo 
            campaign={campaign} 
            demoMode={demoMode} 
            dataSource={dataSource}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
