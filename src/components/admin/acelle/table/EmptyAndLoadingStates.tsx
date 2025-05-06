
import React from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

interface EmptyStateProps {
  onSync?: () => void;
  isLoading?: boolean;
}

export const EmptyState = ({ onSync, isLoading }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <Database className="h-12 w-12 text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune campagne trouvée</h3>
      <p className="text-gray-500 mb-4 max-w-md">
        Aucune campagne n'a été trouvée dans le système. Synchronisez avec la plateforme d'emailing pour importer les campagnes.
      </p>
      {onSync && (
        <Button 
          variant="outline" 
          onClick={onSync}
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </Button>
      )}
    </div>
  );
};

export const TableLoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-500">Chargement des campagnes...</p>
    </div>
  </div>
);

export const TableErrorState = ({ error, retryCount, onRetry }: { error: Error | null, retryCount: number, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="bg-red-50 text-red-700 rounded-full p-3 mb-4">
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">Erreur de chargement</h3>
    <p className="text-gray-500 mb-4 max-w-md">
      Impossible de charger les campagnes. {error && error.message}
    </p>
    <Button onClick={onRetry} variant="outline" className="min-w-[200px]">
      Réessayer {retryCount > 0 && `(${retryCount})`}
    </Button>
  </div>
);

export const InactiveAccountState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="bg-amber-50 text-amber-700 rounded-full p-3 mb-4">
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">Compte inactif</h3>
    <p className="text-gray-500 mb-4 max-w-md">
      Veuillez configurer et activer un compte Acelle pour voir les campagnes d'emailing.
    </p>
  </div>
);
