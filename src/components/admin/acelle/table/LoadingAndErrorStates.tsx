
import React from "react";
import { Loader2, AlertTriangle, RefreshCcw, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  onRetry: () => void;
};

export const TableLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Chargement des campagnes...</p>
    </div>
  );
};

export const TableErrorState = ({ onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-destructive font-medium">Erreur lors du chargement des campagnes</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
};

export const EmptyState = () => {
  return (
    <div className="text-center py-12 border rounded-md">
      <h3 className="font-medium text-gray-900">Aucune campagne</h3>
      <p className="text-muted-foreground mt-1">
        Aucune campagne n'a été trouvée pour ce compte.
      </p>
    </div>
  );
};

export const InactiveAccountState = () => {
  return (
    <div className="text-center py-12 border rounded-md bg-muted/30">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <h3 className="font-medium text-gray-900">Compte inactif</h3>
      <p className="text-muted-foreground mt-1">
        Ce compte est actuellement inactif. Activez-le pour voir les campagnes.
      </p>
    </div>
  );
};

export const LoadingState = TableLoadingState;
export const ErrorState = TableErrorState;

