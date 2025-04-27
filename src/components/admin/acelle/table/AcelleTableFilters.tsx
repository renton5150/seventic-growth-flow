
import React from "react";
import { Search, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AcelleTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string | null;
  setStatusFilter: (value: string | null) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

export const AcelleTableFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: AcelleTableFiltersProps) => {
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou sujet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex gap-2">
        <Select 
          value={statusFilter || ""} 
          onValueChange={(v) => setStatusFilter(v || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="queued">En attente</SelectItem>
            <SelectItem value="sending">En cours d'envoi</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={sortBy} 
          onValueChange={setSortBy}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date de création</SelectItem>
            <SelectItem value="updated_at">Date de modification</SelectItem>
            <SelectItem value="run_at">Date d'envoi</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="subject">Sujet</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
            <SelectItem value="open_rate">Taux d'ouverture</SelectItem>
            <SelectItem value="click_rate">Taux de clic</SelectItem>
          </SelectContent>
        </Select>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                {sortOrder === "asc" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : sortOrder === "desc" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sortOrder === "asc" ? "Tri ascendant" : "Tri descendant"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
