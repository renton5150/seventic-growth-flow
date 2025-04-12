
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Loader2, WifiOff } from "lucide-react";

export interface NetworkStatusProps {
  status: "online" | "offline" | "checking";
  error: string | null;
  onRetry: () => void;
  retryCount?: number;
}

export const NetworkStatus = ({ 
  status, 
  error, 
  onRetry,
  retryCount = 0 
}: NetworkStatusProps) => {
  // Ne rien afficher si tout est ok
  if (status === "online" && !error) {
    return null;
  }
  
  // Afficher un indicateur de chargement pendant la vérification
  if (status === "checking") {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <AlertDescription className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Vérification de la connexion...
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <>
      {status === "offline" && (
        <Alert variant="destructive" className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <AlertDescription>
              {retryCount > 2 
                ? "Problème de connexion persistant" 
                : "Problème de connexion au serveur"}
            </AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> 
            {retryCount > 2 ? "Réessayer encore" : "Réessayer"}
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
