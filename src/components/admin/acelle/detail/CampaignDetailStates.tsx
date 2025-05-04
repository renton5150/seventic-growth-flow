
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const CampaignLoadingState = ({ message = "Chargement..." }: LoadingStateProps) => (
  <div className="flex items-center justify-center p-8">
    <Spinner className="h-8 w-8" />
    {message && <span className="ml-3 text-muted-foreground">{message}</span>}
  </div>
);

interface ErrorStateProps {
  error: string | null;
}

export const CampaignErrorState = ({ error }: ErrorStateProps) => (
  <div className="text-center p-8">
    <Alert variant="destructive" className="bg-red-50 border-red-200">
      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
      <AlertDescription className="text-red-800">
        {error || "Erreur lors du chargement des détails de la campagne"}
      </AlertDescription>
    </Alert>
  </div>
);
