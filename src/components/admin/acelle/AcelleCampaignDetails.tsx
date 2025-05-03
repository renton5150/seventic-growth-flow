
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchCampaignsFromCache } from "@/hooks/acelle/useCampaignFetch";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";

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
  const [error, setError] = useState<string | null>(null);

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
        } else {
          // Mode normal: charger depuis le cache et enrichir avec les statistiques
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

  // Fonction pour charger une campagne réelle depuis le cache
  const loadRealCampaign = async (id: string, acct: AcelleAccount) => {
    console.log(`Récupération des statistiques pour la campagne ${id}`);
    
    // Charger depuis le cache
    const campaigns = await fetchCampaignsFromCache([acct]);
    const foundCampaign = campaigns.find(
      c => c.uid === id || c.campaign_uid === id
    );
    
    if (foundCampaign) {
      console.log(`Campagne trouvée: ${foundCampaign.name}`, foundCampaign);
      setCampaign(foundCampaign);
      
      // Récupérer les statistiques complètes
      const statsResult = await fetchAndProcessCampaignStats(foundCampaign, acct);
      
      // Mettre à jour l'état et la campagne avec les statistiques
      setStats(statsResult.statistics);
      foundCampaign.statistics = statsResult.statistics;
      foundCampaign.delivery_info = statsResult.delivery_info;
      
    } else {
      setError("Campagne non trouvée");
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
      last_error: null
    };
    
    // Générer des statistiques
    const { statistics } = await fetchAndProcessCampaignStats(campaignData, null!, { demoMode: true });
    
    // Attribuer les statistiques à la campagne
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
      <div className="text-center p-8 text-red-500">
        <p>Erreur: {error || "Campagne non trouvée"}</p>
      </div>
    );
  }

  // Utiliser les statistiques de la campagne ou créer un objet vide
  const campaignStats = stats || campaign.statistics || {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };

  return (
    <div className="space-y-6">
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
          <CampaignStatistics statistics={campaignStats} />
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
          <CampaignTechnicalInfo campaign={campaign} demoMode={demoMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
