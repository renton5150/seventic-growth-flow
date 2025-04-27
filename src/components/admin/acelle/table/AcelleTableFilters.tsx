
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AcelleTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export const AcelleTableFilters: React.FC<AcelleTableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-full md:w-auto flex-grow">
        <Input
          placeholder="Rechercher par nom ou sujet..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sent">Envoyés</SelectItem>
            <SelectItem value="sending">En cours d'envoi</SelectItem>
            <SelectItem value="queued">En attente</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date de création</SelectItem>
            <SelectItem value="run_at">Date d'envoi</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="subject">Sujet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Select value={sortOrder} onValueChange={onSortOrderChange as any}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Plus récent d'abord</SelectItem>
            <SelectItem value="asc">Plus ancien d'abord</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
