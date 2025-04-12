
import { AppLayout } from "@/components/layout/AppLayout";
import { MissionPermissionsDebug } from "@/components/missions/MissionPermissionsDebug";
import { testSupabaseConnection } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PermissionsDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "checking">("checking");
  
  const checkConnection = async () => {
    setConnectionStatus("checking");
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? "online" : "offline");
      
      if (isConnected) {
        toast.success("Connexion à Supabase établie");
      } else {
        toast.error("Impossible de se connecter à Supabase");
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      setConnectionStatus("offline");
      toast.error("Erreur lors du test de connexion");
    }
  };
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Diagnostic des Permissions</h1>
        
        {connectionStatus !== "online" && (
          <Alert variant={connectionStatus === "checking" ? "default" : "destructive"} className="mb-4">
            <div className="flex items-start">
              <div className="flex-1">
                {connectionStatus === "checking" ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <AlertTitle>Vérification de la connexion...</AlertTitle>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <WifiOff className="h-4 w-4 mr-2" />
                    <AlertTitle>Problème de connexion</AlertTitle>
                  </div>
                )}
                <AlertDescription className="mt-1">
                  {connectionStatus === "checking" 
                    ? "Veuillez patienter pendant que nous vérifions la connexion à Supabase..." 
                    : "Impossible de se connecter à Supabase. Vérifiez votre connexion internet ou si le serveur est disponible."}
                </AlertDescription>
              </div>
              
              {connectionStatus === "offline" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkConnection} 
                  className="ml-4 whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Réessayer
                </Button>
              )}
            </div>
          </Alert>
        )}
        
        <p className="text-muted-foreground">
          Cette page permet de tester les autorisations pour les missions. 
          Utilisez les boutons ci-dessous pour vérifier si vous pouvez modifier vos missions.
        </p>
        
        <MissionPermissionsDebug />
      </div>
    </AppLayout>
  );
};

export default PermissionsDebug;
