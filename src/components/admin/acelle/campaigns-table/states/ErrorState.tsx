
import React from "react";
import { TableLoadingState, TableErrorState } from "../../table/LoadingAndErrorStates";

interface ErrorStateProps {
  isLoading: boolean;
  isError: boolean;
  error: string;
  onRetry: () => void;
  retryCount: number;
  demoMode: boolean;
}

export function ErrorState({
  isLoading,
  isError,
  error,
  onRetry,
  retryCount,
  demoMode
}: ErrorStateProps) {
  // Afficher un état de chargement
  if (isLoading && !demoMode) {
    return <TableLoadingState />;
  }

  // Afficher un état d'erreur
  if (isError && !demoMode) {
    return (
      <TableErrorState 
        error={error}
        onRetry={onRetry}
        retryCount={retryCount}
      />
    );
  }

  // Si on arrive ici, c'est qu'on est en mode démo ou qu'il n'y a ni erreur ni chargement
  return null;
}
