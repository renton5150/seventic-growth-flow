
import React from "react";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AcelleTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string | null;
  setStatusFilter: (value: string | null) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

export const AcelleTableFilters: React.FC<AcelleTableFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) => {
  // Statuses for filtering
  const statuses = [
    { value: null, label: "Tous" },
    { value: "sent", label: "Envoyé" },
    { value: "sending", label: "En cours d'envoi" },
    { value: "scheduled", label: "Programmé" },
    { value: "draft", label: "Brouillon" },
    { value: "queued", label: "En file d'attente" },
    { value: "paused", label: "En pause" },
    { value: "failed", label: "Échoué" }
  ];

  // Sort options
  const sortOptions = [
    { value: "created_at", label: "Date de création" },
    { value: "updated_at", label: "Dernière mise à jour" },
    { value: "name", label: "Nom" },
    { value: "subject", label: "Sujet" },
    { value: "status", label: "Statut" },
    { value: "open_rate", label: "Taux d'ouverture" },
    { value: "click_rate", label: "Taux de clic" },
  ];

  // Toggle sort order
  const handleToggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      {/* Search box */}
      <div className="flex-1 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une campagne..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Status filter */}
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2 items-center">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Statut:</span>
              {statusFilter ? (
                <Badge variant="secondary" className="ml-1">
                  {statuses.find(s => s.value === statusFilter)?.label || statusFilter}
                </Badge>
              ) : (
                "Tous"
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.label}
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Sort options */}
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2 items-center">
              <span className="hidden sm:inline">Trier par:</span>
              {sortOptions.find(option => option.value === sortBy)?.label || "Date de création"}
              <ChevronsUpDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            <hr className="my-1" />
            <DropdownMenuItem onClick={handleToggleSortOrder}>
              {sortOrder === "asc" ? "Ordre croissant" : "Ordre décroissant"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
