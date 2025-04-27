
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export const TableLoadingState = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export const TableErrorState = ({ onRetry }: ErrorStateProps) => {
  return (
    <div className="text-center py-8 border rounded-md bg-muted/20">
      <p className="text-red-500 mb-4">Erreur lors du chargement des campagnes</p>
      <Button onClick={onRetry}>Réessayer</Button>
    </div>
  );
};

export const EmptyState = () => {
  return (
    <div className="text-center py-8 border rounded-md bg-muted/20">
      <p className="text-muted-foreground">Aucune campagne trouvée pour ce compte</p>
    </div>
  );
};

export const InactiveAccountState = () => {
  return (
    <div className="text-center py-8 border rounded-md bg-muted/20">
      <p className="text-muted-foreground">Le compte est inactif. Activez-le pour voir les campagnes.</p>
    </div>
  );
};
