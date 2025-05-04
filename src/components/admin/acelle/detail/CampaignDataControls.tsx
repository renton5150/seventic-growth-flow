
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";

interface CampaignDataControlsProps {
  noStatsAvailable: boolean;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const CampaignDataControls = ({
  noStatsAvailable,
  lastUpdated,
  isLoading,
  onRefresh
}: CampaignDataControlsProps) => {
  return (
    <div className="space-y-4">
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
          onClick={onRefresh} 
          disabled={isLoading}
          className="mt-2 sm:mt-0 sm:ml-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser les stats
        </Button>
      </div>
    </div>
  );
};
