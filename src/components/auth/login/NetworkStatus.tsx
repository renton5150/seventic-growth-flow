
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
  // Ne rien afficher si tout est ok ou si on vérifie simplement la connexion
  if (status === "online" || status === "checking") {
    return null;
  }
  
  // N'afficher une alerte que si on est vraiment hors ligne
  return (
    <>
      {status === "offline" && (
        <Alert variant="destructive" className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <AlertDescription>
              Problème de connexion au serveur
            </AlertDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> 
            Réessayer
          </Button>
        </Alert>
      )}
    </>
  );
};
