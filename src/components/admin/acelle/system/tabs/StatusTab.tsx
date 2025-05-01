
import React from "react";
import { Check, X } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusTabProps {
  authStatus: boolean | null;
  endpointStatus: { [key: string]: boolean };
  cacheInfo: {
    count: number;
    lastUpdate: string | null;
    status: string;
  };
  lastTestTime: Date | null;
}

export const StatusTab: React.FC<StatusTabProps> = ({ 
  authStatus, 
  endpointStatus, 
  cacheInfo, 
  lastTestTime 
}) => {
  return (
    <div className="space-y-4">
      {authStatus === false && (
        <div className="p-4 mb-4 bg-amber-50 text-amber-800 rounded-md">
          <h3 className="font-semibold flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Authentification Supabase requise
          </h3>
          <p className="mt-1 text-sm">
            Vous devez être connecté avec un compte Supabase valide pour utiliser cette fonctionnalité.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">API Campaigns:</span>
          {endpointStatus.campaigns === undefined ? (
            <span className="text-sm text-muted-foreground">Non testé</span>
          ) : endpointStatus.campaigns ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">API Details:</span>
          {endpointStatus.details === undefined ? (
            <span className="text-sm text-muted-foreground">Non testé</span>
          ) : endpointStatus.details ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">EdgeFunction:</span>
          {endpointStatus.campaigns === undefined ? (
            <span className="text-sm text-muted-foreground">Non testé</span>
          ) : (
            <span className={`text-sm ${endpointStatus.campaigns ? "text-green-500" : "text-amber-500"}`}>
              {endpointStatus.campaigns ? "Actif" : "Peut nécessiter un réveil"}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Cache:</span>
          <span className={`text-sm ${
            cacheInfo.status === "available" ? "text-green-500" : 
            cacheInfo.status === "empty" ? "text-amber-500" : "text-red-500"
          }`}>
            {cacheInfo.status === "available" ? `${cacheInfo.count} campagnes` : 
            cacheInfo.status === "empty" ? "Vide" : "Erreur"}
          </span>
        </div>
      </div>
      
      {lastTestTime && (
        <div className="text-sm text-muted-foreground mt-4">
          Dernier test: {lastTestTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};
