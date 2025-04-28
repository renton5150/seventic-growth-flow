
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function TableLoadingState() {
  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-center text-lg font-medium">Chargement des données...</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Récupération des campagnes depuis Acelle Mail
        </p>
      </CardContent>
    </Card>
  );
}

interface TableErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
}

export function TableErrorState({ onRetry, errorMessage }: TableErrorStateProps) {
  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-center text-lg font-medium">Erreur de connexion</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {errorMessage || "Une erreur est survenue lors de la récupération des données."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center pb-6">
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Essayer à nouveau
        </Button>
      </CardFooter>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center">
        <p className="text-center text-lg font-medium">Aucune campagne</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Aucune campagne n'a été trouvée pour ce compte.
        </p>
      </CardContent>
    </Card>
  );
}

export function InactiveAccountState() {
  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-center text-lg font-medium">Compte inactif</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Ce compte est actuellement marqué comme inactif. Veuillez l'activer dans les paramètres de compte pour afficher ses campagnes.
        </p>
      </CardContent>
    </Card>
  );
}
