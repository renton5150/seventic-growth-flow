
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface AcelleTableFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

export const AcelleTableFilters = ({
  searchTerm = "",
  onSearchChange = () => {},
  statusFilter = "all",
  onStatusFilterChange = () => {}
}: AcelleTableFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Rechercher une campagne..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={onStatusFilterChange}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="sent">Envoyée</SelectItem>
          <SelectItem value="sending">En cours d'envoi</SelectItem>
          <SelectItem value="ready">Prête</SelectItem>
          <SelectItem value="failed">Échec</SelectItem>
          <SelectItem value="paused">En pause</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
