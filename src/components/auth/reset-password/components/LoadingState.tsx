
import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <Loader2 className="h-8 w-8 animate-spin text-seventic-500 mb-2" />
      <p className="text-sm text-gray-600">Vérification de votre session...</p>
    </div>
  );
};
