
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const TableLoadingState = () => (
  <div className="flex justify-center items-center p-8">
    <Spinner className="mr-2 h-6 w-6" />
    <span className="text-muted-foreground">Chargement des campagnes...</span>
  </div>
);

export const TableErrorState = ({ 
  error, 
  retryCount, 
  onRetry 
}: { 
  error: Error | null;
  retryCount: number;
  onRetry: () => void;
}) => (
  <Card className="border-destructive">
    <CardContent className="p-6 space-y-4">
      <div className="flex flex-col items-center text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Erreur de chargement</h3>
        <p className="text-sm text-muted-foreground">
          {error?.message || "Une erreur est survenue lors du chargement des campagnes."}
        </p>
      </div>
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          onClick={onRetry}
          disabled={retryCount > 5}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryCount > 3 ? "Réessayer de nouveau" : "Réessayer"}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const EmptyState = ({ 
  onSync,
  isLoading
}: { 
  onSync: () => void;
  isLoading: boolean;
}) => (
  <Card className="border-dashed">
    <CardContent className="p-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <Search className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Aucune campagne trouvée</h3>
        <p className="text-sm text-muted-foreground">
          Aucune campagne n'a été trouvée dans ce compte.
        </p>
        <Button 
          variant="outline" 
          onClick={onSync}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const InactiveAccountState = () => (
  <Card className="border-amber-300 bg-amber-50">
    <CardContent className="p-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <h3 className="text-lg font-semibold text-amber-700">Compte inactif</h3>
        <p className="text-sm text-amber-600">
          Ce compte est inactif ou n'a pas été correctement configuré.
          Veuillez activer ce compte dans les paramètres avant d'accéder à ses campagnes.
        </p>
      </div>
    </CardContent>
  </Card>
);
