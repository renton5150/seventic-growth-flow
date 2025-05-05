
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Affiche un état de chargement
 */
export const TableLoadingState = () => {
  return (
    <Card className="w-full p-6">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Spinner className="h-8 w-8 mb-4" aria-label="Chargement..." />
        <p className="text-muted-foreground">Chargement des campagnes en cours...</p>
      </CardContent>
    </Card>
  );
};

/**
 * Affiche un état d'erreur
 */
export const TableErrorState = ({ 
  error, 
  onRetry, 
  retryCount = 0 
}: { 
  error: string;
  onRetry?: () => void;
  retryCount?: number;
}) => {
  return (
    <Card className="w-full p-6 border-red-200 bg-red-50">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-800 mb-4">
          Une erreur est survenue lors du chargement des données
        </p>
        <p className="text-sm text-red-600 mb-6">
          {error}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryCount > 0 ? `Réessayer (${retryCount})` : "Réessayer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Affiche un état vide
 */
export const EmptyState = ({ onSync }: { onSync?: () => void }) => {
  return (
    <Card className="w-full p-6">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground mb-4">Aucune campagne trouvée</p>
        {onSync && (
          <Button variant="outline" onClick={onSync}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Synchroniser
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Affiche un état pour un compte inactif
 */
export const InactiveAccountState = () => {
  return (
    <Card className="w-full p-6 border-amber-200 bg-amber-50">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
        <p className="text-amber-800">
          Ce compte est inactif. Veuillez l'activer pour voir les campagnes.
        </p>
      </CardContent>
    </Card>
  );
};
