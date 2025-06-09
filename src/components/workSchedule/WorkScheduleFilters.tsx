
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkScheduleFiltersProps {
  isAdmin: boolean;
  availableUsers: Array<{ id: string; name: string; email: string; role: string; }>;
  selectedUserId: string;
  selectedRequestTypes: string[];
  selectedStatuses: string[];
  onUserChange: (userId: string) => void;
  onRequestTypesChange: (types: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
}

export const WorkScheduleFilters: React.FC<WorkScheduleFiltersProps> = ({
  isAdmin,
  availableUsers,
  selectedUserId,
  selectedRequestTypes,
  selectedStatuses,
  onUserChange,
  onRequestTypesChange,
  onStatusesChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Télétravail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>Instructions :</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Cliquez sur une date pour sélectionner/désélectionner un jour de télétravail</li>
            <li>Maximum 2 jours de télétravail par semaine</li>
            <li>Les weekends sont automatiquement exclus</li>
            <li>Cliquez sur un jour déjà sélectionné pour l'annuler</li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800">Règles simplifiées</h4>
          <p className="text-sm text-blue-700 mt-1">
            Plus de validation nécessaire. Votre sélection est automatiquement approuvée.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
