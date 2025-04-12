
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export interface NetworkStatusProps {
  status: "online" | "offline" | "checking";
  error: string | null;
  onRetry: () => void;
}

export const NetworkStatus = ({ status, error, onRetry }: NetworkStatusProps) => {
  // Ne rien afficher si tout est OK
  if (status === "online" && !error) {
    return null;
  }
  
  return (
    <>
      {status === "checking" && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <RefreshCw className="h-4 w-4 animate-spin text-yellow-500 mr-2" />
          <AlertDescription>Vérification de la connexion...</AlertDescription>
        </Alert>
      )}
      
      {status === "offline" && (
        <Alert variant="destructive" className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <div>
              <AlertTitle>Problème de connexion</AlertTitle>
              <AlertDescription>
                {error || "Impossible de se connecter au serveur. Vérifiez votre connexion."}
              </AlertDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-2 whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Réessayer
          </Button>
        </Alert>
      )}
      
      {error && status !== "offline" && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
};
