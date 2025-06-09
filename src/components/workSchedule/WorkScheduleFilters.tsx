
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  const handleRequestTypeToggle = (type: string) => {
    const newTypes = selectedRequestTypes.includes(type)
      ? selectedRequestTypes.filter(t => t !== type)
      : [...selectedRequestTypes, type];
    onRequestTypesChange(newTypes);
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    onStatusesChange(newStatuses);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtre utilisateur pour admin */}
        {isAdmin && (
          <div>
            <Label htmlFor="user-filter">Utilisateur</Label>
            <Select value={selectedUserId} onValueChange={onUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les utilisateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les utilisateurs</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Type de demande - Seulement télétravail */}
        <div>
          <Label>Type de demande</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="telework"
                checked={selectedRequestTypes.includes('telework')}
                onCheckedChange={() => handleRequestTypeToggle('telework')}
              />
              <Label htmlFor="telework">Télétravail</Label>
            </div>
          </div>
        </div>

        {/* Statut - Seulement approuvé */}
        <div>
          <Label>Statut</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="approved"
                checked={selectedStatuses.includes('approved')}
                onCheckedChange={() => handleStatusToggle('approved')}
              />
              <Label htmlFor="approved">Approuvé</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
