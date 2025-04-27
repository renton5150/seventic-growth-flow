
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertOctagon, PowerOff } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex justify-center items-center h-64 my-4">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Chargement des campagnes...</p>
        <p className="text-muted-foreground">Veuillez patienter</p>
      </div>
    </div>
  );
};

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertOctagon className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Les données n'ont pas pu être chargées depuis l'API Acelle.
            <br />
            Veuillez vérifier votre connexion et réessayer.
          </p>
          <Button onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const EmptyState = () => {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium mb-2">Aucune campagne trouvée</p>
          <p className="text-muted-foreground">
            Aucune campagne n'a été trouvée pour ce compte.
            <br />
            Créez votre première campagne dans Acelle Mail.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const InactiveAccountState = () => {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col items-center justify-center text-center">
          <PowerOff className="h-10 w-10 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Compte inactif</h3>
          <p className="text-muted-foreground mb-4">
            Ce compte Acelle est actuellement inactif.
            <br />
            Activez-le dans les paramètres pour voir ses campagnes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Aliases for backward compatibility
export const TableLoadingState = LoadingState;
export const TableErrorState = ErrorState;
