
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
import { InfoIcon, AlertTriangle, RefreshCw } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AcelleEmailCampaigns = () => {
  const { isAdmin, user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastSessionRefresh, setLastSessionRefresh] = useState<Date | null>(null);
  
  // Vérifier l'état d'authentification au chargement et configurer le rafraîchissement automatique
  useEffect(() => {
    // Fonction pour vérifier l'état d'authentification
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const isAuthenticated = !!data?.session?.access_token;
        
        if (!isAuthenticated && user) {
          setAuthError("Session Supabase expirée. Veuillez vous reconnecter.");
        } else if (isAuthenticated) {
          setLastSessionRefresh(new Date());
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
    
    // Rafraîchir automatiquement la session toutes les 5 minutes pour éviter l'expiration
    const sessionRefreshInterval = setInterval(async () => {
      try {
        console.log("Rafraîchissement automatique de la session...");
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("Erreur lors du rafraîchissement automatique:", error);
          setAuthError("Erreur lors du rafraîchissement automatique de la session.");
        } else if (data && data.session) {
          console.log("Session rafraîchie automatiquement avec succès");
          setLastSessionRefresh(new Date());
          setAuthError(null);
        }
      } catch (e) {
        console.error("Exception lors du rafraîchissement automatique:", e);
      }
    }, 5 * 60 * 1000); // 5 minutes au lieu de 10
    
    return () => clearInterval(sessionRefreshInterval);
  }, [user]);
  
  // Force une reconnexion à Supabase
  const handleRefreshAuth = async () => {
    try {
      toast.loading("Rafraîchissement de la session...", { id: "auth-refresh" });
      await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        setAuthError(null);
        setLastSessionRefresh(new Date());
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
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
          <div className="flex items-center gap-2">
            {lastSessionRefresh && (
              <span className="text-xs text-muted-foreground">
                Session mise à jour: {lastSessionRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant="outline"
              onClick={handleRefreshAuth}
              className={authError ? "border-amber-500 text-amber-500 hover:bg-amber-50" : ""}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir la session
            </Button>
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
        
        <AcelleAdminPanel />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
