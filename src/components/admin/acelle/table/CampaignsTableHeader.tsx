
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
  columns, 
  sortBy = "created_at", 
  sortOrder = "desc", 
  onSort = () => {} 
}: TableHeaderProps = {}) => {
  return (
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
  );
};
