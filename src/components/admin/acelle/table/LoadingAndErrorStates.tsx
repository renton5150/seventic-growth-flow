
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de connexion</AlertTitle>
        <AlertDescription>
          Une erreur est survenue lors de la communication avec l'API Acelle Mail.
          Veuillez vérifier que l'API est accessible et que les identifiants sont corrects.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="p-10 flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-center text-lg font-medium">Erreur de connexion</p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {errorMessage || "Une erreur est survenue lors de la récupération des données."}
          </p>
          <div className="text-center text-sm text-muted-foreground mt-4 max-w-md">
            <p>Assurez-vous que :</p>
            <ul className="list-disc list-inside mt-2">
              <li>L'URL de l'API est correcte (généralement terminée par /api/v1)</li>
              <li>Le token API est valide et actif</li>
              <li>Le serveur Acelle Mail est accessible</li>
              <li>Le compte a des permissions suffisantes sur Acelle Mail</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Essayer à nouveau
          </Button>
        </CardFooter>
      </Card>
    </>
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
