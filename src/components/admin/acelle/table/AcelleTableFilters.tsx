
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AcelleTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string | null;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
}

export const AcelleTableFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: AcelleTableFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="w-full md:w-1/3">
        <Input
          placeholder="Rechercher une campagne..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="w-full md:w-1/4">
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => onStatusFilterChange(value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="queued">En attente</SelectItem>
            <SelectItem value="sending">En cours d'envoi</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full md:w-1/4">
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger>
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date de création</SelectItem>
            <SelectItem value="run_at">Date d'envoi</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="subject">Sujet</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
            <SelectItem value="open_rate">Taux d'ouverture</SelectItem>
            <SelectItem value="click_rate">Taux de clic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full md:w-1/6">
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => onSortOrderChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascendant</SelectItem>
            <SelectItem value="desc">Descendant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
