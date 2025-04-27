
import React from "react";
import { Loader2, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const LoadingState = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
      <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des données</p>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
};

export const EmptyState = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Aucune campagne trouvée.</p>
      </CardContent>
    </Card>
  );
};

export const InactiveAccountState = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-muted-foreground">
          Ce compte est inactif. Veuillez l'activer pour voir les campagnes.
        </p>
      </CardContent>
    </Card>
  );
};

// Aliases for backward compatibility
export const TableLoadingState = LoadingState;
export const TableErrorState = ErrorState;
