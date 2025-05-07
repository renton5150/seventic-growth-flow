
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { fetchCampaignsFromCache, fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { createEmptyStatistics, fetchCampaignStatsFromApi, saveCampaignStatsToCache } from "@/services/acelle/api/directStats";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Composants réutilisables
import { CampaignStatistics } from "./stats/CampaignStatistics";
import { CampaignGeneralInfo } from "./detail/CampaignGeneralInfo";
import { CampaignGlobalStats } from "./detail/CampaignGlobalStats";
import { CampaignTechnicalInfo } from "./detail/CampaignTechnicalInfo";

interface AcelleCampaignDetailsProps {
  campaignId: string;
  account: AcelleAccount;
  onClose: () => void;
}

const AcelleCampaignDetails = ({ 
  campaignId, 
  account, 
  onClose
}: AcelleCampaignDetailsProps) => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [stats, setStats] = useState<AcelleCampaignStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Mode normal: charger depuis le cache et enrichir avec les statistiques
        await loadCampaignWithStats(campaignId, account);
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account]);

  // Fonction pour charger une campagne avec ses statistiques
  const loadCampaignWithStats = async (id: string, acct: AcelleAccount) => {
    console.log(`Chargement de la campagne ${id} et de ses statistiques`);
    
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
        try {
          // Utiliser notre nouvelle fonction pour récupérer les statistiques
          const statistics = await fetchCampaignStatsFromApi(foundCampaign, acct);
          
          // Mettre à jour l'état et la campagne avec les statistiques
          setStats(statistics);
          foundCampaign.statistics = statistics;
          
          // Créer les delivery_info depuis les statistiques pour la compatibilité
          const deliveryInfo: DeliveryInfo = {
            total: statistics.subscriber_count,
            delivered: statistics.delivered_count,
            delivery_rate: statistics.delivered_rate,
            opened: statistics.open_count,
            unique_open_rate: statistics.uniq_open_rate,
            clicked: statistics.click_count,
            click_rate: statistics.click_rate,
            bounced: {
              soft: statistics.soft_bounce_count,
              hard: statistics.hard_bounce_count,
              total: statistics.bounce_count
            },
            unsubscribed: statistics.unsubscribe_count,
            complained: statistics.abuse_complaint_count
          };
          
          foundCampaign.delivery_info = deliveryInfo;
        } catch (statsError) {
          console.error("Erreur lors de la récupération des statistiques:", statsError);
          // En cas d'erreur, utiliser les statistiques existantes ou des statistiques vides
          setStats(foundCampaign.statistics || createEmptyStatistics());
        }
      } else {
        setError("Campagne non trouvée");
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la campagne:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de la campagne");
    }
  };

  // Fonction pour rafraîchir manuellement les statistiques
  const handleRefreshStats = async () => {
    if (!campaign || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      toast.loading("Actualisation des statistiques...", { id: "refresh-stats" });
      
      // Utiliser notre fonction améliorée pour récupérer les statistiques
      const statistics = await fetchCampaignStatsFromApi(campaign, account, { forceRefresh: true });
      
      // Mettre à jour l'état
      setStats(statistics);
      
      // Mettre à jour la campagne
      setCampaign(prev => {
        if (!prev) return null;
        
        // Créer les delivery_info depuis les statistiques pour la compatibilité
        const deliveryInfo: DeliveryInfo = {
          total: statistics.subscriber_count,
          delivered: statistics.delivered_count,
          delivery_rate: statistics.delivered_rate,
          opened: statistics.open_count,
          unique_open_rate: statistics.uniq_open_rate,
          clicked: statistics.click_count,
          click_rate: statistics.click_rate,
          bounced: {
            soft: statistics.soft_bounce_count,
            hard: statistics.hard_bounce_count,
            total: statistics.bounce_count
          },
          unsubscribed: statistics.unsubscribe_count,
          complained: statistics.abuse_complaint_count
        };
        
        return {
          ...prev,
          statistics: statistics,
          delivery_info: deliveryInfo
        };
      });
      
      toast.success("Statistiques actualisées avec succès", { id: "refresh-stats" });
    } catch (error) {
      console.error("Erreur lors de l'actualisation des statistiques:", error);
      toast.error("Erreur lors de l'actualisation des statistiques", { id: "refresh-stats" });
    } finally {
      setIsRefreshing(false);
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
  const campaignStats = stats || campaign.statistics || createEmptyStatistics();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <CampaignGeneralInfo campaign={campaign} />
          <CampaignGlobalStats statistics={campaignStats} />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          className="ml-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
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
          <CampaignTechnicalInfo campaign={campaign} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
