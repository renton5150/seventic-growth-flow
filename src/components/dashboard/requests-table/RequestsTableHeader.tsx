import { useState } from "react";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [openFilters, setOpenFilters] = useState<{[key: string]: boolean}>({});

  const toggleFilter = (column: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const isFilterOpen = (column: string) => openFilters[column] || false;

  const handleCheckboxChange = (column: string, value: string, checked: boolean) => {
    const currentFilters = filters[column] || [];
    let newFilters;

    if (checked) {
      newFilters = [...currentFilters, value];
    } else {
      newFilters = currentFilters.filter(filterValue => filterValue !== value);
    }

    onFilterChange(column, newFilters);
  };

  const isCheckboxChecked = (column: string, value: string) => {
    return filters[column]?.includes(value) || false;
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead>Type</TableHead>
        <TableHead>Titre</TableHead>
        <TableHead>Mission</TableHead>
        {showSdr && <TableHead>SDR</TableHead>}
        <TableHead>Statut</TableHead>
        <TableHead>Échéance</TableHead>
        <TableHead>Créée le</TableHead>
        
        {/* Nouvelle colonne pour la Plateforme d'emailing */}
        <TableHead>Plateforme d'emailing</TableHead>
        
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
