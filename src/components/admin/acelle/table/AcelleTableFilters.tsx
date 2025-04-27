
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AcelleTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const AcelleTableFilters: React.FC<AcelleTableFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="w-full md:w-1/2">
        <Input 
          placeholder="Rechercher une campagne..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Select 
        value={statusFilter} 
        onValueChange={setStatusFilter}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="sent">Envoyés</SelectItem>
          <SelectItem value="sending">En cours</SelectItem>
          <SelectItem value="scheduled">Planifiés</SelectItem>
          <SelectItem value="failed">Échoués</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline"
        onClick={() => {
          setSearchTerm('');
          setStatusFilter('all');
        }}
      >
        Réinitialiser
      </Button>
    </div>
  );
};
