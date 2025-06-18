
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface MissionErrorStateProps {
  onRetry: () => void;
  error?: string;
}

export const MissionErrorState = ({ onRetry, error }: MissionErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Erreur de chargement
      </h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        {error || "Impossible de charger les missions. Veuillez réessayer."}
      </p>
      <Button onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
};
