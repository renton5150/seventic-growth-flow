
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
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
    
    checkAuth();
  }, [user]);
  
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
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
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
        </div>
        
        {authError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}
        
        {isDemoMode && (
          <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
            <InfoIcon className="h-4 w-4 mr-2" />
            <AlertDescription>
              Mode démonstration activé : certaines données peuvent être temporaires en raison de problèmes de connexion à l'API.
            </AlertDescription>
          </Alert>
        )}
        
        <AcelleAdminPanel onDemoModeChange={setIsDemoMode} />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
