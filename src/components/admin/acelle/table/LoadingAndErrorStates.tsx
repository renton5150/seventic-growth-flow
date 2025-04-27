
import React from "react";
import { Loader2, AlertCircle, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TableLoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
    <h3 className="text-xl font-semibold mb-2">Chargement des données</h3>
    <p className="text-muted-foreground">
      Récupération des campagnes en cours...
    </p>
  </div>
);

export const TableErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Erreur de chargement</h3>
    <p className="text-muted-foreground max-w-md mb-6">
      Une erreur est survenue lors de la récupération des données. Veuillez réessayer.
    </p>
    <Button onClick={onRetry}>
      Réessayer
    </Button>
  </div>
);

export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Package2 className="h-10 w-10 text-gray-400 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Aucune campagne trouvée</h3>
    <p className="text-muted-foreground">
      Il n'y a pas de campagnes correspondant à vos critères.
    </p>
  </div>
);

export const InactiveAccountState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-10 w-10 text-yellow-500 mb-4" />
    <h3 className="text-xl font-semibold mb-2">Compte inactif</h3>
    <p className="text-muted-foreground max-w-md">
      Ce compte Acelle Mail est actuellement inactif. Veuillez l'activer pour accéder aux campagnes.
    </p>
  </div>
);
