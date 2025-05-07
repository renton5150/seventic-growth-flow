
import React, { useState, useEffect } from 'react';
import { useAcelleApiStatus } from '@/hooks/acelle/useAcelleApiStatus';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, AlertTriangle, X, Wifi, WifiOff, Loader2, CheckCircle2, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { wakeupCorsProxy, getAuthToken, forceRefreshAuthToken, setupHeartbeatService } from '@/services/acelle/cors-proxy';

export function ApiStatusMonitor() {
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
  
  // Vérifier si le heartbeat est actif au chargement
  useEffect(() => {
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
  useEffect(() => {
    if (checkCounter > 0 && heartbeatActive) {
      setLastHeartbeat(new Date());
    }
  }, [checkCounter, heartbeatActive]);

  return (
    <div className="space-y-6">
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
                onClick={() => {
                  const authSuccess = isAuthenticated ? "✓" : "✗";
                  const proxySuccess = isProxyAvailable ? "✓" : "✗";
                  
                  toast.info(
                    <div className="space-y-2">
                      <p>Diagnostic du système:</p>
                      <p>Authentification: {authSuccess}</p>
                      <p>Services CORS: {proxySuccess}</p>
                      <p>Heartbeat: {heartbeatActive ? "actif" : "inactif"}</p>
                      <p>Vérifications: {checkCounter}</p>
                      <p>{lastCheck ? `Dernière: ${lastCheck.toLocaleTimeString()}` : "Pas de vérification"}</p>
                    </div>, 
                    { duration: 5000 }
                  );
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> 
                Diagnostic
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
