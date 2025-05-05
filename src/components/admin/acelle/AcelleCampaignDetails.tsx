
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { fetchCampaignsFromCache, fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/stats/campaignStats";
import { supabase } from "@/integrations/supabase/client";

// Composants réutilisables
import { CampaignStatistics } from "./stats/CampaignStatistics";
import { CampaignGeneralInfo } from "./detail/CampaignGeneralInfo";
import { CampaignGlobalStats } from "./detail/CampaignGlobalStats";
import { CampaignTechnicalInfo } from "./detail/CampaignTechnicalInfo";
import { acelleService } from "@/services/acelle";

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

  // Fonction pour charger une campagne réelle depuis le cache ou directement depuis la base de données
  const loadRealCampaign = async (id: string, acct: AcelleAccount) => {
    console.log(`Récupération des statistiques pour la campagne ${id}`);
    
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
        
        // Récupérer les statistiques complètes
        const enrichedCampaign = await fetchAndProcessCampaignStats(foundCampaign, acct, { refresh: true }) as AcelleCampaign;
        
        // Mettre à jour l'état et la campagne avec les statistiques
        if (enrichedCampaign && enrichedCampaign.statistics) {
          setStats(enrichedCampaign.statistics);
          foundCampaign.statistics = enrichedCampaign.statistics;
          
          // Assurez-vous que delivery_info est du bon type
          if (enrichedCampaign.delivery_info) {
            foundCampaign.delivery_info = enrichedCampaign.delivery_info as DeliveryInfo;
          }
        }
      } else {
        setError("Campagne non trouvée");
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la campagne:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de la campagne");
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

  // Optimiser la fonction fetchCampaignDetails pour utiliser le cache plus efficacement
  const fetchCampaignDetails = async () => {
    if (!campaignId || !account) {
      setError("Identifiant de campagne ou compte manquant");
      setIsLoading(false);
      return;
    }
    
    try {
      // Récupérer les détails de la campagne
      const campaign = await acelleService.campaigns.fetchOne(campaignId, account);
      
      if (!campaign) {
        setError("Campagne introuvable");
        setIsLoading(false);
        return;
      }
      
      setCampaign(campaign);
      
      // Enrichir avec les statistiques détaillées seulement si nécessaires
      if (!campaign.statistics || Object.keys(campaign.statistics).length === 0) {
        const enrichedCampaignResult = await acelleService.campaigns.getStats(campaign, account, {
          refresh: false // Utiliser le cache si disponible
        });
        
        // Vérifier si le résultat est un tableau ou un objet unique
        if (enrichedCampaignResult) {
          // S'assurer que nous traitons un seul objet campaigne, pas un tableau
          if (Array.isArray(enrichedCampaignResult)) {
            // Si c'est un tableau, prendre le premier élément s'il existe
            if (enrichedCampaignResult.length > 0) {
              const enrichedCampaign = enrichedCampaignResult[0];
              setCampaign(prevCampaign => ({
                ...prevCampaign!,
                statistics: enrichedCampaign.statistics,
                delivery_info: enrichedCampaign.delivery_info
              }));
            }
          } else {
            // C'est un objet unique, utiliser directement
            setCampaign(prevCampaign => ({
              ...prevCampaign!,
              statistics: enrichedCampaignResult.statistics,
              delivery_info: enrichedCampaignResult.delivery_info
            }));
          }
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails de la campagne:", err);
      setError("Erreur lors de la récupération des détails de la campagne");
      setIsLoading(false);
    }
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
