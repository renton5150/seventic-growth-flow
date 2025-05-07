
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
import { InfoIcon, AlertTriangle, Loader2 } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { useAcelleApiStatus } from "@/hooks/acelle/useAcelleApiStatus";

const AcelleEmailCampaigns = () => {
  const { isAdmin } = useAuth();
  const {
    isAuthenticated,
    isProxyAvailable,
    isChecking,
    authError,
    proxyError,
    forceRefresh
  } = useAcelleApiStatus();

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
          
          {/* Afficher le bouton de rafraîchissement seulement en cas de problème */}
          {(!isAuthenticated || !isProxyAvailable) && (
            <Button 
              variant="outline"
              onClick={forceRefresh}
              disabled={isChecking}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              {isChecking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <InfoIcon className="mr-2 h-4 w-4" />
              )}
              Rafraîchir les services
            </Button>
          )}
        </div>
        
        {/* Alerte d'authentification */}
        {authError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Alerte de proxy */}
        {proxyError && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 mr-2" />
            <AlertDescription>
              {proxyError}
              {isProxyAvailable === false && (
                <>
                  <br />
                  <span className="font-medium">
                    Les fonctionnalités qui nécessitent une communication avec l'API peuvent ne pas fonctionner correctement.
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <AcelleAdminPanel />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
