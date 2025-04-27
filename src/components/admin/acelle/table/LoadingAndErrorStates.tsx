
import React from 'react';
import { Loader2, AlertTriangle, Ban, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ErrorStateProps {
  onRetry: () => void;
}

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-center text-muted-foreground">
        Chargement des campagnes en cours...
      </p>
    </div>
  );
};

export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-5 w-5 mr-2" />
      <AlertTitle>Erreur de chargement</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>
          Une erreur est survenue lors du chargement des campagnes. Veuillez réessayer.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm" className="w-fit">
          Réessayer
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Database className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">Aucune campagne disponible</h3>
      <p className="text-muted-foreground max-w-md">
        Il n'y a actuellement aucune campagne dans ce compte Acelle Mail.
        Vous pouvez créer des campagnes directement dans votre plateforme Acelle Mail.
      </p>
    </div>
  );
};

export const InactiveAccountState = () => {
  return (
    <div className="border rounded-lg p-8 bg-gray-50 text-center">
      <Ban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-medium mb-2">Compte inactif</h3>
      <p className="text-muted-foreground max-w-lg mx-auto">
        Ce compte est actuellement inactif. Veuillez l'activer dans les paramètres
        du compte pour afficher et gérer les campagnes.
      </p>
    </div>
  );
};

export const DataUnavailableAlert = ({ message }: { message: string }) => {
  return (
    <Alert className="mb-6" variant="warning">
      <AlertTriangle className="h-5 w-5 mr-2" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
