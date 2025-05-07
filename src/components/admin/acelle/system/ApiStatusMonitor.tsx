
import React, { useState } from 'react';
import { useAcelleContext } from '@/contexts/AcelleContext';
import { useAcelleApiStatus } from '@/hooks/acelle/useAcelleApiStatus';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, AlertTriangle, X, Wifi, WifiOff, Loader2, CheckCircle2, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { wakeupCorsProxy, getAuthToken, forceRefreshAuthToken, setupHeartbeatService, runAcelleDiagnostic } from '@/services/acelle/cors-proxy';
import { ConnectionTester } from './ConnectionTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ApiStatusMonitor() {
  const { selectedAccount } = useAcelleContext();
  const {
    isAuthenticated,
    isProxyAvailable,
    isChecking,
    lastCheck,
    checkCounter,
    authError,
    proxyError,
    checkSystem,
    forceRefresh
  } = useAcelleApiStatus();
  
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState(5 * 60 * 1000); // 5 minutes par défaut
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const [wakeupAttempts, setWakeupAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('status');
  
  // Gère l'action de rafraîchissement complet
  const handleFullRefresh = async () => {
    await forceRefresh();
    setWakeupAttempts(prev => prev + 1);
  };
  
  // Gère le réveil explicite des services
  const handleWakeupServices = async () => {
    try {
      setIsWakingUp(true);
      toast.loading("Réveil des services en cours...", { id: "wakeup-services" });
      setWakeupAttempts(prev => prev + 1);
      
      const token = await getAuthToken();
      if (!token) {
        toast.error("Authentification requise", { id: "wakeup-services" });
        return;
      }
      
      const result = await wakeupCorsProxy(token);
      
      if (result) {
        toast.success("Services réveillés avec succès", { id: "wakeup-services" });
        await checkSystem();
      } else {
        toast.error("Échec du réveil des services", { id: "wakeup-services" });
      }
    } catch (error) {
      console.error("Erreur lors du réveil des services:", error);
      toast.error("Erreur lors du réveil des services", { id: "wakeup-services" });
    } finally {
      setIsWakingUp(false);
    }
  };
  
  // Gère le rafraîchissement explicite du token
  const handleRefreshToken = async () => {
    try {
      setIsRefreshingAuth(true);
      toast.loading("Rafraîchissement du token...", { id: "refresh-token" });
      
      const token = await forceRefreshAuthToken();
      
      if (token) {
        toast.success("Token rafraîchi avec succès", { id: "refresh-token" });
        await checkSystem();
      } else {
        toast.error("Échec du rafraîchissement du token", { id: "refresh-token" });
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      toast.error("Erreur lors du rafraîchissement du token", { id: "refresh-token" });
    } finally {
      setIsRefreshingAuth(false);
    }
  };
  
  // Active ou désactive le système de heartbeat
  const toggleHeartbeat = () => {
    if (heartbeatActive) {
      // Désactiver le heartbeat
      window.localStorage.setItem('acelle_heartbeat_disabled', 'true');
      setHeartbeatActive(false);
      toast.info("Service de heartbeat désactivé");
    } else {
      // Activer le heartbeat
      window.localStorage.removeItem('acelle_heartbeat_disabled');
      const cleanup = setupHeartbeatService(heartbeatInterval);
      setHeartbeatActive(true);
      setLastHeartbeat(new Date());
      toast.success("Service de heartbeat activé");
      
      // Le nettoyage sera perdu au rechargement, mais c'est ok car on utilise le localStorage
      return () => cleanup();
    }
  };
  
  // Effectue un diagnostic complet
  const runDiagnostic = async () => {
    try {
      toast.loading("Exécution du diagnostic...", { id: "diagnostic" });
      const result = await runAcelleDiagnostic();
      setDiagnosticResult(result);
      
      toast.success("Diagnostic terminé", { id: "diagnostic" });
      setActiveTab('diagnostic');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur de diagnostic: ${errorMessage}`, { id: "diagnostic" });
    }
  };
  
  // Vérifier si le heartbeat est actif au chargement
  React.useEffect(() => {
    const isDisabled = window.localStorage.getItem('acelle_heartbeat_disabled');
    const active = !isDisabled;
    
    setHeartbeatActive(active);
    
    if (active) {
      const cleanup = setupHeartbeatService(heartbeatInterval);
      setLastHeartbeat(new Date());
      return cleanup;
    }
  }, []);
  
  // Mettre à jour la date du dernier heartbeat quand le compteur de vérification change
  React.useEffect(() => {
    if (checkCounter > 0 && heartbeatActive) {
      setLastHeartbeat(new Date());
    }
  }, [checkCounter, heartbeatActive]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="status">État des Services</TabsTrigger>
          <TabsTrigger value="connection">Test de Connexion</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>État des services API</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFullRefresh} 
                  disabled={isChecking || isWakingUp || isRefreshingAuth}
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Rafraîchir tout
                </Button>
              </div>
              <CardDescription>
                Statut des services pour la communication avec l'API Acelle
                {lastCheck && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    Dernière vérification: {lastCheck.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* État d'authentification */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Authentification</h3>
                  <p className="text-sm text-muted-foreground">
                    Session Supabase active
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge 
                    variant={isAuthenticated ? "default" : "destructive"}
                    className={`mr-4 ${isAuthenticated ? "bg-green-500" : ""}`}
                  >
                    {isAuthenticated ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefreshToken}
                    disabled={isRefreshingAuth}
                  >
                    {isRefreshingAuth ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* État des proxies */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Services CORS</h3>
                  <p className="text-sm text-muted-foreground">
                    Proxies Edge Functions
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge 
                    variant={isProxyAvailable ? "default" : "destructive"}
                    className={`mr-4 ${isProxyAvailable ? "bg-green-500" : ""}`}
                  >
                    {isProxyAvailable ? (
                      <>
                        <Wifi className="h-3 w-3 mr-1" />
                        En ligne
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 mr-1" />
                        Hors ligne
                      </>
                    )}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleWakeupServices}
                    disabled={isWakingUp}
                  >
                    {isWakingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* État du heartbeat */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Service Heartbeat</h3>
                  <p className="text-sm text-muted-foreground">
                    Maintien actif des services
                    {lastHeartbeat && (
                      <span className="block">Dernier battement: {lastHeartbeat.toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center">
                  <Badge 
                    variant={heartbeatActive ? "default" : "outline"}
                    className={`mr-4 ${heartbeatActive ? "bg-blue-500" : ""}`}
                  >
                    {heartbeatActive ? (
                      <>
                        <Hourglass className="h-3 w-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant={heartbeatActive ? "default" : "outline"} 
                    onClick={toggleHeartbeat}
                  >
                    {heartbeatActive ? (
                      "Désactiver"
                    ) : (
                      "Activer"
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Compteur de tentatives */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Tentatives de réveil</p>
                    <p className="text-xs text-muted-foreground">Depuis le chargement de la page</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-0.5">{wakeupAttempts}</Badge>
                </div>
              </div>
              
              {/* Affichage des erreurs */}
              {(authError || proxyError) && (
                <div className="mt-4 space-y-3">
                  {authError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {proxyError && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{proxyError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-0">
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-4">
                  {isAuthenticated && isProxyAvailable ? (
                    "Tous les services sont opérationnels"
                  ) : (
                    "Certains services ne sont pas disponibles - cliquez sur les boutons pour réessayer"
                  )}
                </p>
                
                {/* Actions de maintenance avancées */}
                <div className="flex gap-2 justify-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={runDiagnostic}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> 
                    Diagnostic complet
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="connection">
          <ConnectionTester account={selectedAccount} />
        </TabsContent>
        
        <TabsContent value="diagnostic">
          <Card>
            <CardHeader>
              <CardTitle>Résultat du diagnostic</CardTitle>
              <CardDescription>
                Informations détaillées sur l'état du système
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {diagnosticResult ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <h4 className="font-medium mb-2 flex items-center">
                      Résultat global
                      <Badge 
                        variant={diagnosticResult.success ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {diagnosticResult.success ? "OK" : "Problème"}
                      </Badge>
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Authentification:</p>
                        <p className="text-sm">
                          {diagnosticResult.results.auth.success ? 
                            "✅ Authentifiée" : 
                            "❌ Non authentifiée"}
                        </p>
                        {diagnosticResult.results.auth.error && (
                          <p className="text-xs text-red-600">
                            Erreur: {diagnosticResult.results.auth.error}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Services Proxy:</p>
                        <p className="text-sm">
                          CORS Proxy: {diagnosticResult.results.proxy.corsProxy ? "✅ En ligne" : "❌ Hors ligne"}<br/>
                          Acelle Proxy: {diagnosticResult.results.proxy.acelleProxy ? "✅ En ligne" : "❌ Hors ligne"}
                        </p>
                        {diagnosticResult.results.proxy.error && (
                          <p className="text-xs text-red-600">
                            Erreur: {diagnosticResult.results.proxy.error}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Horodatage:</p>
                        <p className="text-sm">{new Date(diagnosticResult.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <details>
                    <summary className="cursor-pointer text-sm">Données brutes du diagnostic</summary>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-xs overflow-auto max-h-96">
                      {JSON.stringify(diagnosticResult, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    Aucun diagnostic n'a encore été effectué
                  </p>
                  <Button onClick={runDiagnostic} className="mt-4">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> 
                    Lancer un diagnostic
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
