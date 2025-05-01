
import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, RefreshCw, Power, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseAuthenticated } from "@/services/missions-service/auth/supabaseAuth";
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const SystemStatus = () => {
  const { isAdmin } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [cacheInfo, setCacheInfo] = useState<{
    count: number;
    lastUpdate: string | null;
    status: string;
  }>({
    count: 0,
    lastUpdate: null,
    status: "unknown"
  });

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

  // Fetch cache information for diagnostic purposes
  const fetchCacheInfo = async () => {
    try {
      const { data, error, count } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error("Error fetching cache info:", error);
        setCacheInfo(prev => ({ ...prev, status: "error" }));
        return;
      }
      
      // Get the most recent cache update
      const { data: latestData } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at')
        .order('cache_updated_at', { ascending: false })
        .limit(1);
        
      setCacheInfo({
        count: count || 0,
        lastUpdate: latestData && latestData.length > 0 ? latestData[0].cache_updated_at : null,
        status: count && count > 0 ? "available" : "empty"
      });
      
    } catch (e) {
      console.error("Error in fetchCacheInfo:", e);
      setCacheInfo(prev => ({ ...prev, status: "error" }));
    }
  };

  // Load cache info when component mounts and when tab changes
  useEffect(() => {
    if (activeTab === "cache") {
      fetchCacheInfo();
    }
  }, [activeTab]);

  const wakeUpEdgeFunctions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      toast.loading("Réveil des services en cours...", { id: "wake-services" });
      
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
      toast.success("Services réveillés avec succès", { id: "wake-services" });
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      toast.error(`Erreur lors du réveil des services: ${e instanceof Error ? e.message : 'Erreur inconnue'}`, { id: "wake-services" });
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

  const refreshCacheInfo = async () => {
    toast.loading("Actualisation des informations du cache...", { id: "refresh-cache" });
    await fetchCacheInfo();
    toast.success("Informations du cache actualisées", { id: "refresh-cache" });
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
      
      // Update cache status after API test
      if (activeTab === "cache" || activeTab === "status") {
        await fetchCacheInfo();
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
        <CardTitle className="flex items-center gap-2">
          État du système
          <Badge variant={authStatus ? "default" : "destructive"} className="ml-2">
            {authStatus ? "Authentifié" : "Non authentifié"}
          </Badge>
        </CardTitle>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="status">État des services</TabsTrigger>
            <TabsTrigger value="cache">Cache de campagnes</TabsTrigger>
            <TabsTrigger value="debug">Diagnostic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="cache" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-4">
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
            
            <div className="p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Conseils de dépannage</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Vérifiez que votre session Supabase est active</li>
                <li>Essayez de "Réveiller les services" si les API sont inaccessibles</li>
                <li>Vérifiez les identifiants API dans les paramètres du compte</li>
                <li>Si le cache est vide, synchronisez les campagnes depuis un compte valide</li>
                <li>En cas d'erreurs 403, vérifiez les permissions de votre compte Acelle</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

