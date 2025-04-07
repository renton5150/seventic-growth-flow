
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Loader2 } from "lucide-react";

interface ConnectionStatusProps {
  status: "online" | "offline" | "checking";
  onRetry: () => void;
}

export const ConnectionStatus = ({ status, onRetry }: ConnectionStatusProps) => {
  if (status === "online") {
    return null;
  }

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
  );
};
