
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort: (column: string) => void;
  showSdr?: boolean;
  isSDR?: boolean;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  filters: {[key: string]: string[]};
  dateFilters: {[key: string]: any};
  onFilterChange: (column: string, values: string[]) => void;
  onDateFilterChange: (field: string, type: string, values: any) => void;
}

export const RequestsTableHeader = ({ 
  missionView = false, 
  handleSort,
  showSdr = false,
  isSDR = false,
  sortColumn,
  sortDirection,
  filters,
  dateFilters,
  onFilterChange,
  onDateFilterChange
}: RequestsTableHeaderProps) => {
  const { user } = useAuth();
  
  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  // Fonction pour traduire les statuts en français
  const translateStatus = (status: string): string => {
    switch(status) {
      case "pending": return "En attente";
      case "inprogress": return "En cours";
      case "completed": return "Terminée";
      case "rejected": return "Rejetée";
      default: return status;
    }
  };

  // Fonction pour afficher une popover de filtrage par type
  const renderFilterPopover = (columnName: string, options: string[]) => {
    const selectedValues = filters[columnName] || [];
    const hasFilter = selectedValues.length > 0;

    // Si l'utilisateur est un SDR et que c'est la colonne mission, 
    // ne pas afficher le filtre car il n'a accès qu'à ses propres missions
    if (isSDR && (columnName === "mission" || columnName === "title")) {
      return null;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={hasFilter ? "default" : "ghost"} size="icon" className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}>
            <Filter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="end">
          <div className="space-y-4">
            <h4 className="font-medium">Filtrer par {columnName}</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {options.map(option => {
                // Traduire les statuts si c'est la colonne status
                const displayOption = columnName === "status" ? translateStatus(option) : option;
                
                return (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`${columnName}-${option}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onFilterChange(columnName, [...selectedValues, option]);
                        } else {
                          onFilterChange(columnName, selectedValues.filter(v => v !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`${columnName}-${option}`}>{displayOption || "Non assigné"}</Label>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onFilterChange(columnName, [])}
              >
                Effacer les filtres
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Fonction pour afficher la popover de filtrage par date
  const renderDateFilterPopover = (columnName: string) => {
    const currentFilter = dateFilters[columnName];
    const hasFilter = currentFilter && currentFilter.type;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={hasFilter ? "default" : "ghost"} size="icon" className={hasFilter ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}>
            <Filter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Filtrer par date</h4>
            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Select 
                  onValueChange={(value) => {
                    if (value === "none") {
                      onDateFilterChange(columnName, "", null);
                    } else {
                      onDateFilterChange(columnName, value, currentFilter?.values || {});
                    }
                  }}
                  value={currentFilter?.type || "none"}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type de filtre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun filtre</SelectItem>
                    <SelectItem value="equals">Est égal à</SelectItem>
                    <SelectItem value="before">Est avant</SelectItem>
                    <SelectItem value="after">Est après</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currentFilter?.type && (
                <CalendarComponent
                  mode="single"
                  selected={currentFilter?.values?.date}
                  onSelect={(date) => {
                    onDateFilterChange(columnName, currentFilter.type, { date });
                  }}
                  className="rounded-md border"
                />
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">
          <div className="flex items-center justify-between">
            <span>Type</span>
            {renderFilterPopover("type", ["email", "database", "linkedin"])}
          </div>
        </TableHead>
        
        <TableHead> 
          <div className="flex items-center justify-between">
            <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("title")}>
              Titre
              {getSortIcon("title")}
            </div>
            {renderFilterPopover("title", [])}
          </div>
        </TableHead>
        
        {/* Toujours afficher la colonne mission, même pour les SDR */}
        <TableHead>
          <div className="flex items-center justify-between">
            <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("missionName")}>
              Mission
              {getSortIcon("missionName")}
            </div>
            {renderFilterPopover("mission", [])}
          </div>
        </TableHead>
        
        {showSdr && (
          <TableHead>
            <div className="flex items-center justify-between">
              <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("sdrName")}>
                SDR
                {getSortIcon("sdrName")}
              </div>
              {renderFilterPopover("sdr", [])}
            </div>
          </TableHead>
        )}
        
        <TableHead>
          <div className="flex items-center justify-between">
            <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("status")}>
              Statut
              {getSortIcon("status")}
            </div>
            {renderFilterPopover("status", ["pending", "inprogress", "completed", "rejected"])}
          </div>
        </TableHead>
        
        <TableHead>
          <div className="flex items-center justify-between">
            <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("dueDate")}>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                Échéance
              </div>
              {getSortIcon("dueDate")}
            </div>
            {renderDateFilterPopover("dueDate")}
          </div>
        </TableHead>
        
        <TableHead>
          <div className="flex items-center justify-between">
            <div className="cursor-pointer flex items-center gap-1" onClick={() => handleSort("createdAt")}>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                Créée le
              </div>
              {getSortIcon("createdAt")}
            </div>
            {renderDateFilterPopover("createdAt")}
          </div>
        </TableHead>
        
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
