
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const TableLoadingState = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={32} className="w-8 h-8" />
        <p className="text-muted-foreground">Chargement des campagnes...</p>
      </div>
    </div>
  );
};

interface TableErrorStateProps {
  error: string;
  onRetry: () => void;
  retryCount: number;
}

export const TableErrorState = ({ error, onRetry, retryCount }: TableErrorStateProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Erreur lors du chargement des campagnes</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>{error}</p>
        <Button 
          variant="outline"
          size="sm"
          className="self-start"
          onClick={onRetry}
          disabled={retryCount > 3}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryCount > 3 ? "Trop de tentatives" : "Réessayer"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

interface EmptyStateProps {
  onSync: () => void;
}

export const EmptyState = ({ onSync }: EmptyStateProps) => {
  return (
    <div className="text-center p-8 border rounded-md">
      <div className="flex flex-col items-center gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h3 className="text-lg font-medium">Aucune campagne trouvée</h3>
        <p className="text-muted-foreground">
          Aucune campagne n'est disponible pour ce compte.
        </p>
        <Button onClick={onSync}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Synchroniser les campagnes
        </Button>
      </div>
    </div>
  );
};

export const InactiveAccountState = () => {
  return (
    <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle>Compte inactif</AlertTitle>
      <AlertDescription>
        Ce compte Acelle est actuellement inactif. Pour voir les campagnes, veuillez d'abord activer ce compte.
      </AlertDescription>
    </Alert>
  );
};
