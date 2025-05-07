
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { ApiStatusMonitor } from "@/components/admin/acelle/system/ApiStatusMonitor";
import { ConnectionTester } from "@/components/admin/acelle/system/ConnectionTester";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InfoIcon, RefreshCw, Loader2, AlertTriangle, Shield } from "lucide-react";
import { useAcelleApiStatus } from "@/hooks/acelle/useAcelleApiStatus";
import { toast } from "sonner";
import { setupHeartbeatService, runAcelleDiagnostic } from "@/services/acelle/cors-proxy";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAcelleContext } from "@/contexts/AcelleContext";

const AcelleEmailCampaigns = () => {
  const { isAdmin } = useAuth();
  const { selectedAccount } = useAcelleContext();
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
  const [isRunningEmergencyFix, setIsRunningEmergencyFix] = useState(false);
  const [showConnectivityHelp, setShowConnectivityHelp] = useState(false);

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
      setShowConnectivityHelp(true);
    }
  }, [isAuthenticated, isProxyAvailable, activeTab]);
  
  // Fonction de réparation d'urgence - réinitialise tout et force le rafraîchissement
  const runEmergencyFix = async () => {
    try {
      setIsRunningEmergencyFix(true);
      toast.loading("Réinitialisation complète en cours...", { id: "emergency-fix" });
      
      // Force le rafraîchissement complet du token et des services
      await forceRefresh();
      
      // Réactive le heartbeat s'il était inactif
      if (!heartbeatActive) {
        const cleanup = setupHeartbeatService(3 * 60 * 1000);
        setHeartbeatActive(true);
      }
      
      // Lance un diagnostic complet
      const diagnosticResult = await runAcelleDiagnostic();
      
      if (diagnosticResult.success) {
        toast.success("Réparation réussie! Les services sont maintenant opérationnels.", { id: "emergency-fix" });
      } else {
        toast.error("La réinitialisation n'a pas résolu tous les problèmes. Consultez l'onglet système pour plus de détails.", { id: "emergency-fix" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur lors de la réparation: ${errorMessage}`, { id: "emergency-fix" });
    } finally {
      setIsRunningEmergencyFix(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
          
          <div className="flex gap-2">
            {/* Bouton d'urgence en cas de problèmes graves persistants */}
            {(!isAuthenticated || !isProxyAvailable) && (
              <Button 
                variant="destructive"
                onClick={runEmergencyFix}
                disabled={isRunningEmergencyFix}
                className="border-red-700 bg-red-600 text-white hover:bg-red-700"
              >
                {isRunningEmergencyFix ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Réparation d'urgence
              </Button>
            )}
            
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
            
            <Button
              variant="ghost"
              onClick={() => setShowConnectivityHelp(!showConnectivityHelp)}
            >
              <InfoIcon className="h-5 w-5" />
            </Button>
          </div>
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
        
        {/* Aide à la connectivité */}
        {showConnectivityHelp && (
          <Alert variant="warning" className="bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Guide de résolution des problèmes de connexion</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
                <li>Vérifiez que vous êtes bien connecté à votre compte utilisateur</li>
                <li>Cliquez sur "Rafraîchir les services" pour réinitialiser la connexion</li>
                <li>Si le problème persiste, utilisez l'onglet "Système" puis "Test de Connexion"</li>
                <li>En cas d'échec répété, utilisez le bouton "Réparation d'urgence"</li>
                <li>Vérifiez que les paramètres de compte Acelle sont corrects</li>
                <li>Vérifiez que l'API Acelle est bien accessible depuis internet</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

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
            <div className="space-y-6">
              {/* Mini test de connectivité en haut pour un diagnostic rapide */}
              {!isAuthenticated || !isProxyAvailable ? (
                <ConnectionTester account={selectedAccount} />
              ) : null}
              
              {/* Panneau complet de surveillance du système */}
              <ApiStatusMonitor />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
