
import React from "react";
import { Button } from "@/components/ui/button";
import { Inbox, AlertCircle, RefreshCw, AlertTriangle, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const EmptyState = ({ 
  onSync, 
  isLoading = false 
}: { 
  onSync?: () => void;
  isLoading?: boolean;
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
      <Inbox className="h-10 w-10 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune campagne</h3>
      <p className="mt-2 text-sm text-gray-500">
        Aucune campagne n'a été trouvée dans le système.
      </p>
      {onSync && (
        <Button
          onClick={onSync}
          className="mt-4"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniser
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export const TableLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
      <Spinner className="h-8 w-8 text-primary" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Chargement...</h3>
      <p className="mt-2 text-sm text-gray-500">
        Récupération des données de campagnes.
      </p>
    </div>
  );
};

export const TableErrorState = ({ 
  error, 
  retryCount, 
  onRetry 
}: { 
  error: Error | null; 
  retryCount: number; 
  onRetry: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-red-300 p-12 text-center">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Erreur de chargement</h3>
      <p className="mt-2 text-sm text-gray-500">
        {error?.message || "Une erreur s'est produite lors du chargement des campagnes."}
      </p>
      <Button 
        onClick={onRetry} 
        className="mt-4" 
        variant="outline"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Réessayer {retryCount > 0 ? `(${retryCount})` : ''}
      </Button>
    </div>
  );
};

export const InactiveAccountState = () => {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-amber-300 p-12 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Compte inactif</h3>
      <p className="mt-2 text-sm text-gray-500">
        Le compte Acelle n'est pas configuré ou est inactif. Veuillez activer le compte pour voir les campagnes.
      </p>
    </div>
  );
};
