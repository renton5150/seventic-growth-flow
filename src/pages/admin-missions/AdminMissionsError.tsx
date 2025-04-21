
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

interface AdminMissionsErrorProps {
  onRetry: () => void;
}

export const AdminMissionsError: React.FC<AdminMissionsErrorProps> = ({
  onRetry,
}) => (
  <AppLayout>
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-red-500">Erreur lors du chargement des missions</p>
      <Button onClick={onRetry}>Réessayer</Button>
    </div>
  </AppLayout>
);
