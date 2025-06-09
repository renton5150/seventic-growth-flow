
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WorkScheduleFiltersProps {
  isAdmin: boolean;
  availableUsers: Array<{ id: string; name: string; role: string }>;
  selectedUserId: string;
  selectedRequestTypes: string[];
  selectedStatuses: string[];
  onUserChange: (userId: string) => void;
  onRequestTypesChange: (types: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
}

const requestTypeLabels = {
  telework: 'Télétravail',
  paid_leave: 'Congé payé',
  unpaid_leave: 'Congé sans solde'
};

const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé'
};

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
  const handleRequestTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onRequestTypesChange([...selectedRequestTypes, type]);
    } else {
      onRequestTypesChange(selectedRequestTypes.filter(t => t !== type));
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onStatusesChange([...selectedStatuses, status]);
    } else {
      onStatusesChange(selectedStatuses.filter(s => s !== status));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtre par utilisateur (admin uniquement) */}
        {isAdmin && (
          <div>
            <Label className="text-sm font-medium">Utilisateur</Label>
            <Select value={selectedUserId} onValueChange={onUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les utilisateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les utilisateurs</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtre par type de demande */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Type de demande</Label>
          <div className="space-y-2">
            {Object.entries(requestTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedRequestTypes.includes(type)}
                  onCheckedChange={(checked) => handleRequestTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`type-${type}`} className="text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Filtre par statut */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Statut</Label>
          <div className="space-y-2">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                />
                <Label htmlFor={`status-${status}`} className="text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
