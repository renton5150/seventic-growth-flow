
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

export interface NetworkStatusProps {
  status: "online" | "offline" | "checking";
  error: string | null;
  onRetry: () => void;
}

export const NetworkStatus = ({ status, error, onRetry }: NetworkStatusProps) => {
  // Ne rien afficher si tout est ok
  if (status === "online" && !error) {
    return null;
  }
  
  return (
    <>
      {status === "offline" && (
        <Alert variant="destructive" className="mb-4 flex justify-between items-center">
          <AlertDescription>Problème de connexion au serveur</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-2"
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
