
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchCampaignsFromCache, fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { enrichCampaignsWithStats } from "@/services/acelle/api/directStats";
import { supabase } from "@/integrations/supabase/client";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStatsAvailable, setNoStatsAvailable] = useState(false);

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      setNoStatsAvailable(false);
      
      try {
        if (demoMode) {
          // Mode démo est désactivé pour empêcher l'utilisation de données simulées
          setError("Mode démo désactivé - seules des données réelles sont autorisées");
        } else {
          // Mode normal: charger depuis le cache et n'utiliser que des statistiques réelles
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
      const campaigns = await fetchCampaignsFromCache([acct], 1, 50, true);
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
        // Vérifier si la campagne a des statistiques réelles
        const hasValidStats = 
          foundCampaign.statistics && 
          foundCampaign.statistics.subscriber_count > 0;
        
        const hasValidDeliveryInfo =
          foundCampaign.delivery_info &&
          (typeof foundCampaign.delivery_info.total === 'number' && foundCampaign.delivery_info.total > 0);
          
        console.log(`Vérification des statistiques pour ${foundCampaign.name}:`, {
          hasValidStats,
          hasValidDeliveryInfo,
          stats: foundCampaign.statistics,
          deliveryInfo: foundCampaign.delivery_info
        });
          
        if (hasValidStats || hasValidDeliveryInfo) {
          console.log(`La campagne ${foundCampaign.name} a des statistiques réelles, utilisation des données existantes`);
          setCampaign(foundCampaign);
        } else {
          console.log(`La campagne ${foundCampaign.name} n'a pas de statistiques valides`);
          
          try {
            // Obtenir un token valide pour l'authentification
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token || "";
            
            // Essayer d'enrichir la campagne avec des statistiques réelles uniquement
            console.log("Tentative d'enrichissement de la campagne avec des statistiques réelles...");
            const enrichedCampaigns = await enrichCampaignsWithStats([foundCampaign], acct, token);
            
            if (enrichedCampaigns && enrichedCampaigns.length > 0) {
              const enrichedCampaign = enrichedCampaigns[0];
              console.log("Campagne enrichie:", enrichedCampaign);
              
              // Vérifier à nouveau si des statistiques réelles sont disponibles après enrichissement
              if (enrichedCampaign.statistics || 
                  (enrichedCampaign.delivery_info && 
                   typeof enrichedCampaign.delivery_info.total === 'number' && 
                   enrichedCampaign.delivery_info.total > 0)) {
                console.log("Statistiques réelles trouvées après enrichissement");
                setCampaign(enrichedCampaign);
              } else {
                console.log("Aucune statistique réelle trouvée, même après enrichissement");
                setCampaign(foundCampaign); // Utiliser la campagne sans statistiques
                setNoStatsAvailable(true);
              }
            } else {
              console.log("Aucune campagne enrichie retournée");
              setCampaign(foundCampaign); // Utiliser la campagne sans statistiques
              setNoStatsAvailable(true);
            }
          } catch (enrichError) {
            console.error("Erreur lors de l'enrichissement de la campagne:", enrichError);
            setCampaign(foundCampaign); // Utiliser la campagne sans statistiques
            setNoStatsAvailable(true);
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

  return (
    <div className="space-y-6">
      {/* Alerte si aucune statistique réelle n'est disponible */}
      {noStatsAvailable && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <AlertDescription className="text-red-800">
            Aucune statistique réelle n'est disponible pour cette campagne. Veuillez synchroniser les données pour obtenir des statistiques réelles.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Information sur les données */}
      {!noStatsAvailable && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-800">
            Affichage des données réelles de la campagne.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Informations générales et statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampaignGeneralInfo campaign={campaign} />
        {!noStatsAvailable ? (
          <CampaignGlobalStats 
            statistics={campaign.statistics} 
            isSimulated={false}
          />
        ) : (
          <Card className="p-4 flex items-center justify-center h-full">
            <p className="text-gray-500">Aucune statistique disponible</p>
          </Card>
        )}
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
          <TabsTrigger value="links">Liens et clics</TabsTrigger>
          <TabsTrigger value="technical">Informations techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 py-4">
          {!noStatsAvailable ? (
            <CampaignStatistics 
              statistics={campaign.statistics}
              isSimulated={false}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Les statistiques détaillées ne sont pas disponibles pour cette campagne.</p>
            </Card>
          )}
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
            hasSimulatedStats={false}
            noStatsAvailable={noStatsAvailable}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
