
import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CacheTabProps {
  cacheInfo: {
    count: number;
    lastUpdate: string | null;
    status: string;
  };
  refreshCacheInfo: () => Promise<void>;
}

export const CacheTab: React.FC<CacheTabProps> = ({ cacheInfo, refreshCacheInfo }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Informations du cache</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCacheInfo}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between">
          <span className="font-medium">Nombre de campagnes en cache:</span>
          <span>{cacheInfo.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Dernière mise à jour:</span>
          <span>{cacheInfo.lastUpdate ? new Date(cacheInfo.lastUpdate).toLocaleString() : "Jamais"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">État du cache:</span>
          <span className={`${
            cacheInfo.status === "available" ? "text-green-500" : 
            cacheInfo.status === "empty" ? "text-amber-500" : "text-red-500"
          }`}>
            {cacheInfo.status === "available" ? "Disponible" : 
              cacheInfo.status === "empty" ? "Vide" : "Erreur"}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Le cache est utilisé pour accéder aux campagnes lorsque l'API Acelle n'est pas disponible.
        {cacheInfo.status === "empty" && " Actuellement le cache est vide, ce qui peut causer des problèmes d'affichage des campagnes."}
      </p>
    </div>
  );
};
