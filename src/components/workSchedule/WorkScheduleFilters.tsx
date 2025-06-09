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
      <CardContent>
        {/* Espace vide - texte supprimé selon la demande */}
      </CardContent>
    </Card>
  );
};
