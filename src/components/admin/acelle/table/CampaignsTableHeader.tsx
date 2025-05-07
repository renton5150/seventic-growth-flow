
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface TableHeaderProps {
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export const CampaignsTableHeader = ({ 
  columns = [], 
  sortBy = "created_at", 
  sortOrder = "desc", 
  onSort = () => {} 
}: TableHeaderProps = {}) => {
  // Helper pour afficher l'icône de tri appropriée
  const getSortIcon = (column: string) => {
    if (column === sortBy) {
      return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />;
  };
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Nom</TableHead>
        <TableHead>Sujet</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead>Date d'envoi</TableHead>
        <TableHead className="text-right">Destinataires</TableHead>
        <TableHead className="text-right">Taux d'ouverture</TableHead>
        <TableHead className="text-right">Taux de clic</TableHead>
        <TableHead className="text-right">Action</TableHead>
      </TableRow>
    </TableHeader>
  );
};
