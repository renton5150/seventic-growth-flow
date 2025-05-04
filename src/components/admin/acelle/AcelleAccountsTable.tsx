
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDown, ChevronUp, RefreshCw, Plus } from "lucide-react";
import { AcelleAccount } from "@/types/acelle.types";
import { AcelleTableRow } from "@/components/admin/acelle/AcelleTableRow";

export interface AcelleAccountsTableProps {
  accounts: AcelleAccount[];
  isLoading: boolean;
  error: string | null;
  onCreateAccount?: () => void;
  onEditAccount?: (account: AcelleAccount) => void;
  onSyncAccount?: (account: AcelleAccount) => void;
  onDeleteAccount?: (account: AcelleAccount) => void;
  onRefresh?: () => void;
}

export default function AcelleAccountsTable({
  accounts = [],
  isLoading = false,
  error = null,
  onCreateAccount,
  onEditAccount,
  onSyncAccount,
  onDeleteAccount,
  onRefresh,
}: AcelleAccountsTableProps) {
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredAccounts = accounts
    .filter(account => {
      // Appliquer le filtre de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          account.name.toLowerCase().includes(searchLower) ||
          account.api_endpoint.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(account => {
      // Appliquer le filtre de statut
      if (statusFilter === "all") return true;
      return account.status === statusFilter;
    })
    .sort((a, b) => {
      // Appliquer le tri
      const direction = sortDirection === "asc" ? 1 : -1;
      
      if (sortColumn === "name") {
        return a.name.localeCompare(b.name) * direction;
      } else if (sortColumn === "status") {
        return a.status.localeCompare(b.status) * direction;
      } else if (sortColumn === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      }
      
      return 0;
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <Button variant="outline" onClick={onRefresh} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">Aucun compte Acelle trouvé</p>
        <Button onClick={onCreateAccount} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Créer un compte
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher des comptes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="Rafraîchir la liste"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={onCreateAccount} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau compte
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer w-[200px]"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Nom du compte
                  {sortColumn === "name" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Endpoint API</TableHead>
              <TableHead
                className="cursor-pointer w-[120px]"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Statut
                  {sortColumn === "status" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center">
                  Créé le
                  {sortColumn === "created_at" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Dernière synchronisation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <AcelleTableRow
                key={account.id}
                account={account}
                onEdit={onEditAccount}
                onSync={onSyncAccount}
                onDelete={onDeleteAccount}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredAccounts.length} compte{filteredAccounts.length !== 1 ? "s" : ""} affiché
        {filteredAccounts.length !== 1 ? "s" : ""}
        {accounts.length !== filteredAccounts.length && ` (sur ${accounts.length} total)`}
      </div>
    </div>
  );
}
