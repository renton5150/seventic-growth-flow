
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Import du nouveau hook pour les statistiques
import { useSmartCampaignStats } from "@/hooks/acelle/useSmartCampaignStats";

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
  onClose,
}: AcelleCampaignDetailsProps) => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStatsAvailable, setNoStatsAvailable] = useState(false);
  
  // Utiliser le hook pour les statistiques
  const { 
    statistics, 
    isLoading: statsLoading, 
    loadStatistics,
    lastUpdated
  } = useSmartCampaignStats({
    campaign,
    account,
    autoLoad: false // Ne pas charger automatiquement, nous le ferons manuellement après avoir la campagne
  });

  // Chargement des détails de la campagne
  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      setNoStatsAvailable(false);
      
      try {
        // Charger la campagne depuis la base de données
        const loadedCampaign = await fetchCampaignById(campaignId, account.id);
        
        if (!loadedCampaign) {
          throw new Error("Impossible de récupérer les détails de la campagne");
        }
        
        console.log(`Campagne ${loadedCampaign.name} chargée`, loadedCampaign);
        setCampaign(loadedCampaign);
        
        // Une fois la campagne chargée, utiliser notre hook pour charger les statistiques
        loadStatistics(true);
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account, loadStatistics]);

  // Effet pour mettre à jour le statut des statistiques quand statistics change
  useEffect(() => {
    if (campaign && statistics) {
      // Mettre à jour la campagne avec les statistiques récupérées
      setCampaign(prev => prev ? { ...prev, statistics } : null);
      setNoStatsAvailable(false);
    } else if (campaign && !statistics) {
      setNoStatsAvailable(true);
    }
  }, [campaign, statistics]);

  const handleRefreshStats = async () => {
    if (!campaign) return;
    
    try {
      await loadStatistics(true); // Forcer le rafraîchissement
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des statistiques:", err);
      setError("Erreur lors du rafraîchissement des statistiques");
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
      
      {/* Information sur les données et bouton de rafraîchissement */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        {!noStatsAvailable && (
          <Alert variant="default" className="bg-green-50 border-green-200 flex-grow">
            <Info className="h-4 w-4 text-green-500 mr-2" />
            <AlertDescription className="text-green-800">
              Affichage des données réelles de la campagne
              {lastUpdated && (
                <span className="ml-1 text-xs text-green-600">
                  (mise à jour {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: fr })})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshStats} 
          disabled={statsLoading}
          className="mt-2 sm:mt-0 sm:ml-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
          Actualiser les stats
        </Button>
      </div>
      
      {/* Informations générales et statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampaignGeneralInfo campaign={campaign} />
        {!noStatsAvailable ? (
          <CampaignGlobalStats statistics={campaign.statistics} />
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
            <CampaignStatistics statistics={campaign.statistics} />
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
            noStatsAvailable={noStatsAvailable}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcelleCampaignDetails;
