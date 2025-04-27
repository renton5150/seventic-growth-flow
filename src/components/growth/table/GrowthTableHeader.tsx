
import React from "react";
import { format, isSameDay as dateFnsIsSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

// Define DateFilter type
export interface DateFilter {
  type?: string;
  values?: { date: Date };
}

// Use this component as a simplified version that matches the props passed from GrowthRequestsTable
export const GrowthTableHeader = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  handleDownload,
  resetFilters,
}) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <span className="sr-only">Actions</span>
        </TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Mission</TableHead>
        <TableHead>Titre</TableHead>
        <TableHead>SDR</TableHead>
        <TableHead>Assigné à</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead>Date limite</TableHead>
        <TableHead>Créée le</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
