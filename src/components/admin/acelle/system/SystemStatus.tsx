
import { useState } from "react";
import { Check, X, AlertTriangle, RefreshCw, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseAuthenticated } from "@/services/missions-service/auth/supabaseAuth";
import { AcelleAccount } from "@/types/acelle.types";

export const SystemStatus = () => {
  const { isAdmin } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);

  if (!isAdmin) return null;

  // Create a test account to use for API checks
  const testAccount: AcelleAccount = {
    id: "system-test",
    apiEndpoint: "https://emailing.plateforme-solution.net",
    apiToken: "test-token",
    name: "System Test",
    status: "active" as "active" | "inactive" | "error", // Explicitly type as the required union type
    created_at: new Date().toISOString(),
    lastSyncDate: null,
    lastSyncError: null,
    cachePriority: 0
  };

  const wakeUpEdgeFunctions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      const wakeUpPromises = [
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        }).catch(() => console.log("Wake-up attempt for cors-proxy completed"))
      ];
      
      await Promise.all(wakeUpPromises);
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      return false;
    }
  };

  const checkApiAvailability = async () => {
    try {
      const connectionDebug = await acelleService.testAcelleConnection(testAccount);
      setDebugInfo(connectionDebug);
      return {
        available: connectionDebug.success,
        debugInfo: connectionDebug
      };
    } catch (e) {
      console.error("API availability check failed:", e);
      return {
        available: false,
        error: e instanceof Error ? e.message : "Unknown error",
        debugInfo: null
      };
    }
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    try {
      toast.loading("Test des services en cours...", { id: "api-test" });
      
      // Vérifier d'abord l'état de l'authentification Supabase
      const isAuthenticated = await isSupabaseAuthenticated();
      setAuthStatus(isAuthenticated);
      
      if (!isAuthenticated) {
        toast.error("Authentification Supabase requise", { id: "api-test" });
        setIsTesting(false);
        return;
      }
      
      // Tenter de réveiller les fonctions Edge avant le test principal
      await wakeUpEdgeFunctions();
      
      // First check API accessibility
      const apiStatus = await checkApiAvailability();
      
      if (apiStatus.debugInfo) {
        setDebugInfo(apiStatus.debugInfo);
      }
      
      const status = {
        endpoints: {
          campaigns: apiStatus.available,
          details: apiStatus.available
        }
      };
      
      setEndpointStatus(status.endpoints || {});
      setLastTestTime(new Date());
      
      if (apiStatus.available) {
        toast.success("Tous les services sont opérationnels", { id: "api-test" });
      } else {
        // If API is not available, try to wake up services
        toast.warning("Services indisponibles, tentative de réveil...", { id: "api-test" });
        await wakeUpEdgeFunctions();
        
        // Check again after wake up attempt
        const retryStatus = await checkApiAvailability();
        
        if (retryStatus.debugInfo) {
          setDebugInfo(retryStatus.debugInfo);
        }
        
        if (retryStatus.available) {
          toast.success("Services réveillés avec succès", { id: "api-test" });
          setEndpointStatus({
            campaigns: true,
            details: true
          });
        } else {
          toast.error("Certains services restent indisponibles", { id: "api-test" });
          
          // Add more specific error information
          if (retryStatus.error) {
            toast.error(`Erreur: ${retryStatus.error}`, { id: "api-test-details", duration: 5000 });
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      toast.error(`Erreur lors du test des services: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { id: "api-test" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>État du système</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={wakeUpEdgeFunctions}
            disabled={isTesting}
          >
            <Power className="h-4 w-4 mr-2" />
            Réveiller les services
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            disabled={isTesting}
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isTesting ? "Test en cours..." : "Tester les services"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
          </div>
          
          {debugInfo && (
            <div className={`mt-4 p-4 rounded-md ${debugInfo.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {debugInfo.success ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={`text-sm ${debugInfo.success ? 'text-green-700' : 'text-red-700'}`}>
                  {debugInfo.errorMessage || `Statut: ${debugInfo.statusCode || 'Inconnu'}`}
                </span>
              </div>
              
              {debugInfo.statusCode && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Code HTTP: {debugInfo.statusCode}
                </div>
              )}
              
              {debugInfo.duration && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Temps de réponse: {debugInfo.duration}ms
                </div>
              )}
              
              {!debugInfo.success && debugInfo.request && (
                <div className="mt-2 text-xs font-mono overflow-hidden text-ellipsis max-w-full">
                  <details>
                    <summary className="cursor-pointer text-muted-foreground">Détails de la requête</summary>
                    <div className="p-2 mt-2 bg-gray-100 rounded text-muted-foreground">
                      <div>URL: {debugInfo.request.url?.substring(0, 100)}</div>
                      {debugInfo.request.headers && (
                        <div className="mt-1">
                          Headers: {JSON.stringify(debugInfo.request.headers, null, 2)}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
              
              {!debugInfo.success && debugInfo.responseData && (
                <div className="mt-2 text-xs font-mono overflow-hidden text-ellipsis max-w-full">
                  <details>
                    <summary className="cursor-pointer text-muted-foreground">Détails de la réponse</summary>
                    <div className="p-2 mt-2 bg-gray-100 rounded text-muted-foreground">
                      {typeof debugInfo.responseData === 'object' 
                        ? JSON.stringify(debugInfo.responseData, null, 2)
                        : debugInfo.responseData}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
          
          {lastTestTime && (
            <div className="text-sm text-muted-foreground mt-4">
              Dernier test: {lastTestTime.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add missing supabase import
import { supabase } from "@/integrations/supabase/client";
