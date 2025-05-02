
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AcelleTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string | null;
  onStatusFilterChange: (value: string | null) => void;
}

export const AcelleTableFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AcelleTableFiltersProps) => {
  // Liste des statuts possibles
  const statuses = [
    { value: null, label: "Tous les statuts" },
    { value: "new", label: "Nouveau" },
    { value: "ready", label: "Prêt" },
    { value: "sending", label: "En envoi" },
    { value: "sent", label: "Envoyé" },
    { value: "done", label: "Terminé" },
    { value: "queued", label: "En attente" },
    { value: "paused", label: "En pause" },
    { value: "failed", label: "Échoué" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex items-center w-full max-w-sm">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
      </div>

      <Select
        value={statusFilter || ""}
        onValueChange={(value) => onStatusFilterChange(value === "" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value || "all"} value={status.value || ""}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
