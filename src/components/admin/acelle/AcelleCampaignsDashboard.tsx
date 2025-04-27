
import React, { useEffect } from "react";
import { useAcelleCampaigns } from "@/hooks/acelle/useAcelleCampaigns";
import { AcelleAccount } from "@/types/acelle.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, Power } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CampaignsOverview from "./dashboard/CampaignsOverview";
import CampaignsList from "./dashboard/CampaignsList";

interface AcelleCampaignsDashboardProps {
  accounts: AcelleAccount[];
}

export default function AcelleCampaignsDashboard({ accounts }: AcelleCampaignsDashboardProps) {
  const { 
    activeAccounts, 
    campaignsData, 
    isLoading, 
    syncError, 
    handleRetry,
    initializeServices 
  } = useAcelleCampaigns(accounts);

  // Initialisation automatique au chargement du composant
  useEffect(() => {
    if (activeAccounts.length > 0) {
      console.log("Initialisation automatique des services depuis le dashboard");
      initializeServices().catch(err => {
        console.error("Erreur d'initialisation automatique:", err);
      });
    }
  }, [activeAccounts, initializeServices]);

  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun compte actif trouvé</h3>
            <p className="text-muted-foreground max-w-md">
              Aucun compte Acelle Mail actif n'est configuré. Veuillez activer un compte dans l'onglet "Comptes".
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Connexion aux services Acelle en cours...</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Initialisation des services et récupération des données. Cela peut prendre quelques instants.
            </p>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" /> Forcer l'actualisation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (syncError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Échec de la synchronisation: {syncError}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Problème de connexion aux services</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Nous n'avons pas pu récupérer vos campagnes. Vérifiez votre connexion internet et les paramètres API dans vos comptes Acelle.
            </p>
            
            <div className="flex gap-4">
              <Button onClick={handleRetry} className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
              </Button>
              
              <Button variant="outline" onClick={initializeServices} className="flex items-center">
                <Power className="h-4 w-4 mr-2" /> Réveiller les services
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaignsData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune campagne trouvée</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Nous n'avons pas trouvé de campagnes pour les comptes sélectionnés. Vous pouvez créer de nouvelles campagnes depuis Acelle Mail.
            </p>
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tableau de bord des campagnes</h2>
        <Button onClick={handleRetry} size="sm" variant="outline" className="h-8">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Actualiser
        </Button>
      </div>
      
      <CampaignsOverview campaigns={campaignsData} accounts={activeAccounts} />
      <CampaignsList campaigns={campaignsData} />
    </div>
  );
}
