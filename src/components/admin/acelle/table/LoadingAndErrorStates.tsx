
import React from "react";
import { AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";

export const TableLoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-40 border rounded-md">
      <div className="flex flex-col items-center">
        <Spinner className="h-8 w-8 mb-4" />
        <p className="text-sm text-muted-foreground">Chargement des campagnes...</p>
      </div>
    </div>
  );
};

export const TableErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-40 border rounded-md bg-red-50/50">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
      <p className="text-sm font-medium mb-4">Échec du chargement des campagnes</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
      </Button>
    </div>
  );
};

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40 border rounded-md">
      <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
      <p className="text-sm font-medium">Aucune campagne trouvée</p>
      <p className="text-xs text-muted-foreground mt-1">
        Email campaign functionality has been removed
      </p>
    </div>
  );
};

export const InactiveAccountState: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Compte inactif</h3>
          <p className="text-muted-foreground max-w-md">
            Ce compte est actuellement désactivé. Activez-le pour voir les campagnes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
