
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { ApiStatusMonitor } from "@/components/admin/acelle/system/ApiStatusMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InfoIcon, RefreshCw, Loader2 } from "lucide-react";
import { useAcelleApiStatus } from "@/hooks/acelle/useAcelleApiStatus";
import { toast } from "sonner";
import { setupHeartbeatService } from "@/services/acelle/cors-proxy";

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

  const [activeTab, setActiveTab] = useState<string>("campaigns");
  const [heartbeatActive, setHeartbeatActive] = useState<boolean>(false);

  // Active le service de heartbeat au chargement
  useEffect(() => {
    // On active le heartbeat pour maintenir les services en vie
    const cleanupHeartbeat = setupHeartbeatService(3 * 60 * 1000); // 3 minutes
    setHeartbeatActive(true);
    
    return () => {
      cleanupHeartbeat();
      setHeartbeatActive(false);
    };
  }, []);

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Détermine si on doit montrer l'onglet système en premier en cas de problème
  useEffect(() => {
    if ((!isAuthenticated || !isProxyAvailable) && activeTab !== "system") {
      setActiveTab("system");
      toast.warning("Problèmes détectés avec les services API. Vérifiez l'état du système.");
    }
  }, [isAuthenticated, isProxyAvailable]);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
          
          <Button 
            variant="outline"
            onClick={forceRefresh}
            disabled={isChecking}
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Rafraîchir les services
          </Button>
        </div>

        {/* Indicateur de statut - toujours visible */}
        <div className="border rounded-md p-4 bg-gray-50 shadow-sm">
          <div className="flex gap-2 items-center mb-2">
            <div className={`w-3 h-3 rounded-full ${isProxyAvailable && isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              Statut API: {isProxyAvailable && isAuthenticated ? 'Connecté' : 'Déconnecté'}
            </span>
            {heartbeatActive && (
              <span className="text-xs text-gray-500">(Heartbeat actif)</span>
            )}
          </div>
          
          {(!isProxyAvailable || !isAuthenticated) && (
            <p className="text-sm text-red-600 mt-1">
              {!isAuthenticated && "Problème d'authentification. "}
              {!isProxyAvailable && "Services API non disponibles. "}
              Utilisez l'onglet Système pour résoudre les problèmes.
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="system" className={(!isProxyAvailable || !isAuthenticated) ? "bg-amber-100" : ""}>
              Système
              {(!isProxyAvailable || !isAuthenticated) && (
                <span className="ml-2 bg-red-500 w-2 h-2 rounded-full"></span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns" className="mt-4">
            <AcelleAdminPanel />
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <ApiStatusMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
