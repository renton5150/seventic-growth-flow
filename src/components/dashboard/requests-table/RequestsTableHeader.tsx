
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, ChevronUp, ChevronDown } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";

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
  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Type</TableHead>
        <TableHead 
          className="cursor-pointer flex items-center gap-1" 
          onClick={() => handleSort("title")}
        >
          Titre
          {getSortIcon("title")}
        </TableHead>
        
        {!missionView && (
          <TableHead 
            className={`cursor-pointer flex items-center gap-1 ${isSDR ? 'hidden' : ''}`}
            onClick={() => handleSort("missionName")}
          >
            Mission
            {getSortIcon("missionName")}
          </TableHead>
        )}
        
        {showSdr && (
          <TableHead 
            className="cursor-pointer flex items-center gap-1" 
            onClick={() => handleSort("sdrName")}
          >
            SDR
            {getSortIcon("sdrName")}
          </TableHead>
        )}
        
        <TableHead 
          className="cursor-pointer flex items-center gap-1" 
          onClick={() => handleSort("status")}
        >
          Statut
          {getSortIcon("status")}
        </TableHead>
        
        <TableHead 
          className="cursor-pointer flex items-center gap-1" 
          onClick={() => handleSort("dueDate")}
        >
          Échéance
          {getSortIcon("dueDate")}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
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
                          onDateFilterChange("dueDate", null, null);
                        } else {
                          onDateFilterChange("dueDate", value, dateFilters.dueDate?.values || {});
                        }
                      }}
                      value={dateFilters.dueDate?.type || "none"}
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
                  {dateFilters.dueDate?.type && (
                    <Calendar
                      mode="single"
                      selected={dateFilters.dueDate?.values?.date}
                      onSelect={(date) => {
                        onDateFilterChange("dueDate", dateFilters.dueDate.type, { date });
                      }}
                      className="rounded-md border"
                    />
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TableHead>
        
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
