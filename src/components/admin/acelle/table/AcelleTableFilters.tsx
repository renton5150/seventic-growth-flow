
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface AcelleTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const AcelleTableFilters: React.FC<AcelleTableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
        <Input
          placeholder="Rechercher des campagnes..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select 
        value={statusFilter}
        onValueChange={onStatusFilterChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="sent">Envoyé</SelectItem>
          <SelectItem value="sending">En envoi</SelectItem>
          <SelectItem value="queued">En attente</SelectItem>
          <SelectItem value="ready">Prêt</SelectItem>
          <SelectItem value="new">Nouveau</SelectItem>
          <SelectItem value="paused">En pause</SelectItem>
          <SelectItem value="failed">Échoué</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
