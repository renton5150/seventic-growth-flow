
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { EmailPlatformAccountFilters as FiltersType } from "@/types/emailPlatforms.types";
import { useEmailPlatforms } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { useMissionsQuery } from "@/hooks/useRequestQueries";

interface EmailPlatformAccountFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export const EmailPlatformAccountFilters = ({
  filters,
  onFiltersChange
}: EmailPlatformAccountFiltersProps) => {
  const { data: platforms } = useEmailPlatforms();
  const { data: missions } = useMissionsQuery();

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ""
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtres</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Effacer les filtres
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Plateforme */}
        <Select
          value={filters.platform_id || ""}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              platform_id: value === "all" ? undefined : value 
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les plateformes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les plateformes</SelectItem>
            {platforms?.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mission */}
        <Select
          value={filters.mission_id || ""}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              mission_id: value === "all" ? undefined : value 
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les missions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les missions</SelectItem>
            {missions?.map((mission) => (
              <SelectItem key={mission.id} value={mission.id}>
                {mission.name} - {mission.client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Statut */}
        <Select
          value={filters.status || ""}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              status: value === "all" ? undefined : value as any
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Actif">Actif</SelectItem>
            <SelectItem value="Suspendu">Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
