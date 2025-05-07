
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
import { InfoIcon, AlertTriangle, RefreshCw, WifiOff, Loader2 } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { wakeupCorsProxy, getAuthToken } from "@/services/acelle/cors-proxy";

const AcelleEmailCampaigns = () => {
  const { isAdmin, user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isProxyAvailable, setIsProxyAvailable] = useState<boolean | null>(null);
  const [isCheckingProxy, setIsCheckingProxy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  
  // Vérifier l'état d'authentification au chargement et configurer le rafraîchissement automatique
  useEffect(() => {
    // Fonction pour vérifier l'état d'authentification
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const isAuthenticated = !!data?.session?.access_token;
        
        if (!isAuthenticated && user) {
          setAuthError("Session Supabase expirée. Veuillez vous reconnecter.");
        } else {
          setAuthError(null);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setAuthError("Erreur lors de la vérification de l'authentification.");
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    // Vérifier immédiatement
    checkAuth();
    
    // Rafraîchir automatiquement la session toutes les 10 minutes pour éviter l'expiration
    const sessionRefreshInterval = setInterval(async () => {
      try {
        console.log("Rafraîchissement automatique de la session...");
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("Erreur lors du rafraîchissement automatique:", error);
          setAuthError("Erreur lors du rafraîchissement automatique de la session.");
        } else if (data && data.session) {
          console.log("Session rafraîchie automatiquement avec succès");
          setAuthError(null);
        }
      } catch (e) {
        console.error("Exception lors du rafraîchissement automatique:", e);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(sessionRefreshInterval);
  }, [user]);
  
  // Vérifier la disponibilité du proxy CORS au chargement
  useEffect(() => {
    const checkProxyAvailability = async () => {
      try {
        setIsCheckingProxy(true);
        
        // Obtenir un token d'authentification
        const authToken = await getAuthToken();
        if (!authToken) {
          setProxyError("Token d'authentification non disponible");
          setIsProxyAvailable(false);
          return;
        }
        
        // Tenter de réveiller le proxy
        const isAvailable = await wakeupCorsProxy(authToken);
        setIsProxyAvailable(isAvailable);
        
        if (!isAvailable) {
          setProxyError("Le proxy CORS ne répond pas");
        } else {
          setProxyError(null);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du proxy:", error);
        setProxyError("Erreur lors de la vérification du proxy CORS");
        setIsProxyAvailable(false);
      } finally {
        setIsCheckingProxy(false);
      }
    };
    
    checkProxyAvailability();
  }, []);
  
  // Force une reconnexion à Supabase
  const handleRefreshAuth = async () => {
    try {
      toast.loading("Rafraîchissement de la session...", { id: "auth-refresh" });
      await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setAuthError(null);
        toast.success("Session rafraîchie avec succès", { id: "auth-refresh" });
      } else {
        setAuthError("Impossible de rafraîchir la session. Veuillez vous reconnecter.");
        toast.error("Échec du rafraîchissement de la session", { id: "auth-refresh" });
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de la session:", error);
      toast.error("Erreur lors du rafraîchissement de la session", { id: "auth-refresh" });
    }
  };
  
  // Force un réveil du proxy CORS
  const handleWakeupProxy = async () => {
    try {
      setIsCheckingProxy(true);
      toast.loading("Réveil du proxy CORS...", { id: "proxy-wakeup" });
      
      // Obtenir un token d'authentification
      const authToken = await getAuthToken();
      if (!authToken) {
        toast.error("Token d'authentification non disponible", { id: "proxy-wakeup" });
        setProxyError("Token d'authentification non disponible");
        setIsProxyAvailable(false);
        return;
      }
      
      // Tenter de réveiller le proxy
      const isAvailable = await wakeupCorsProxy(authToken);
      setIsProxyAvailable(isAvailable);
      
      if (!isAvailable) {
        setProxyError("Le proxy CORS ne répond pas");
        toast.error("Le proxy CORS ne répond pas", { id: "proxy-wakeup" });
      } else {
        setProxyError(null);
        toast.success("Proxy CORS réveillé avec succès", { id: "proxy-wakeup" });
      }
    } catch (error) {
      console.error("Erreur lors du réveil du proxy:", error);
      setProxyError("Erreur lors du réveil du proxy CORS");
      toast.error("Erreur lors du réveil du proxy CORS", { id: "proxy-wakeup" });
      setIsProxyAvailable(false);
    } finally {
      setIsCheckingProxy(false);
    }
  };
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
          <div className="flex gap-2">
            {authError && (
              <Button 
                variant="outline"
                onClick={handleRefreshAuth}
                className="border-amber-500 text-amber-500 hover:bg-amber-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Rafraîchir la session
              </Button>
            )}
            
            {isProxyAvailable === false && (
              <Button 
                variant="outline"
                onClick={handleWakeupProxy}
                disabled={isCheckingProxy}
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                {isCheckingProxy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WifiOff className="mr-2 h-4 w-4" />
                )}
                Réveiller le proxy
              </Button>
            )}
          </div>
        </div>
        
        {authError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}
        
        {proxyError && (
          <Alert variant={isProxyAvailable === false ? "destructive" : "default"} className={isProxyAvailable === false ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
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
