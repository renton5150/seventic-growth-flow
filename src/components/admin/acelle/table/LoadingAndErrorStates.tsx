
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, PlusCircle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const TableLoadingState = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8 mb-4" />
        <p className="text-muted-foreground">Chargement des campagnes...</p>
      </div>
    </div>
  );
};

export interface TableErrorStateProps {
  onRetry: () => void;
  retryCount: number;
  error: string;
}

export const TableErrorState = ({ error, onRetry, retryCount }: TableErrorStateProps) => {
  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="pt-6 pb-4 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">
          {retryCount > 0 ? (
            `${retryCount} tentative${retryCount > 1 ? "s" : ""} effectuée${
              retryCount > 1 ? "s" : ""
            }`
          ) : (
            "Une erreur est survenue lors du chargement des campagnes"
          )}
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </CardFooter>
    </Card>
  );
};

export interface EmptyStateProps {
  onSync?: () => void;
}

export const EmptyState = ({ onSync }: EmptyStateProps) => {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="pt-6 pb-4 text-center">
        <h3 className="text-lg font-semibold mb-2">Aucune campagne trouvée</h3>
        <p className="text-muted-foreground mb-4">
          Vous n'avez pas encore de campagnes ou elles n'ont pas pu être chargées.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        {onSync && (
          <Button
            variant="default"
            onClick={onSync}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Synchroniser les campagnes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export const InactiveAccountState = () => {
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="pt-6 pb-4 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Compte inactif</h3>
        <p className="text-muted-foreground">
          Ce compte n'est pas actif. Veuillez l'activer dans les paramètres pour voir les campagnes.
        </p>
      </CardContent>
    </Card>
  );
};
