
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { fetchCampaignsFromCache, fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { createEmptyStatistics } from "@/services/acelle/api/directStats";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { wakeupCorsProxy } from "@/services/acelle/cors-proxy";

// Composants réutilisables
import { CampaignStatistics } from "./stats/CampaignStatistics";
import { CampaignGeneralInfo } from "./detail/CampaignGeneralInfo";
import { CampaignGlobalStats } from "./detail/CampaignGlobalStats";
import { CampaignTechnicalInfo } from "./detail/CampaignTechnicalInfo";

/**
 * Récupère et traite les statistiques d'une campagne
 * Fonction dédiée pour être utilisée dans AcelleCampaignDetails
 */
async function fetchAndProcessCampaignStats(
  campaign: AcelleCampaign, 
  account: AcelleAccount,
  options?: { refresh?: boolean }
): Promise<{ 
  statistics: AcelleCampaignStatistics, 
  delivery_info?: DeliveryInfo 
}> {
  try {
    // Tenter de réveiller le proxy CORS d'abord
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await wakeupCorsProxy(token);
    } else {
      console.warn("Aucun token disponible pour réveiller le CORS proxy");
    }

    // Préparer la requête pour les statistiques de la campagne
    const apiPath = `/api/v1/campaigns/${campaign.uid}/statistics`;
    const url = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/${apiPath}`;
    
    // Préparer les en-têtes
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Acelle-Token": account.api_token,
      "X-Acelle-Endpoint": account.api_endpoint,
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`Récupération des statistiques pour la campagne ${campaign.name} (${campaign.uid})`);
    
    // Faire la requête API
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de la récupération des statistiques: ${response.status}`, errorText);
      
      // Retourner les statistiques existantes ou des statistiques vides
      return { 
        statistics: campaign.statistics || createEmptyStatistics(),
        delivery_info: campaign.delivery_info
      };
    }
    
    // Analyser la réponse
    const statsData = await response.json();
    
    console.log(`Statistiques récupérées pour ${campaign.name}:`, statsData);
    
    // Extraire les statistiques
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: Number(statsData.subscriber_count || 0),
      delivered_count: Number(statsData.delivered_count || 0),
      delivered_rate: Number(statsData.delivered_rate || 0),
      open_count: Number(statsData.open_count || 0),
      uniq_open_rate: Number(statsData.uniq_open_rate || 0),
      click_count: Number(statsData.click_count || 0),
      click_rate: Number(statsData.click_rate || 0),
      bounce_count: Number(statsData.bounce_count || 0),
      soft_bounce_count: Number(statsData.soft_bounce_count || 0),
      hard_bounce_count: Number(statsData.hard_bounce_count || 0),
      unsubscribe_count: Number(statsData.unsubscribe_count || 0),
      abuse_complaint_count: Number(statsData.abuse_complaint_count || 0),
      open_rate: Number(statsData.open_rate || 0)
    };
    
    // Générer un objet delivery_info avec les mêmes données
    const delivery_info: DeliveryInfo = {
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
    
    // Sauvegarder les statistiques dans le cache
    try {
      await supabase
        .from('campaign_stats_cache')
        .upsert({
          account_id: account.id,
          campaign_uid: campaign.uid,
          statistics: statistics,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'campaign_uid'
        });
    } catch (e) {
      console.error("Erreur lors de la mise à jour du cache des statistiques:", e);
    }
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    
    // En cas d'erreur, retourner les statistiques existantes ou des statistiques vides
    return { 
      statistics: campaign.statistics || createEmptyStatistics(),
      delivery_info: campaign.delivery_info
    };
  }
}

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
        await loadRealCampaign(campaignId, account);
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account]);

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
        const statsResult = await fetchAndProcessCampaignStats(foundCampaign, acct, {
          refresh: true
        });
        
        // Mettre à jour l'état et la campagne avec les statistiques
        setStats(statsResult.statistics);
        foundCampaign.statistics = statsResult.statistics;
        
        // Assurez-vous que delivery_info est du bon type
        if (statsResult.delivery_info) {
          foundCampaign.delivery_info = statsResult.delivery_info as DeliveryInfo;
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
      toast.loading("Actualisation des statistiques...");
      
      const statsResult = await fetchAndProcessCampaignStats(campaign, account, { refresh: true });
      
      setStats(statsResult.statistics);
      setCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          statistics: statsResult.statistics,
          delivery_info: statsResult.delivery_info || prev.delivery_info
        };
      });
      
      toast.success("Statistiques actualisées avec succès");
    } catch (error) {
      console.error("Erreur lors de l'actualisation des statistiques:", error);
      toast.error("Erreur lors de l'actualisation des statistiques");
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
    abuse_complaint_count: 0,
    open_rate: 0
  };

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
