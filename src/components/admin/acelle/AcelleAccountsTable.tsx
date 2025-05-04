
import React, { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, CalendarIcon, Edit, Trash, ListFilter } from "lucide-react";
import { AcelleAccount } from "@/types/acelle.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AcelleAccountForm from "./AcelleAccountForm";
import { AcelleFormValues } from "./AcelleAccountForm.types";
import { useAcelleAccountsFilter } from "@/hooks/acelle/useAcelleAccountsFilter";

interface AcelleAccountsTableProps {
  accounts: AcelleAccount[];
  isLoading: boolean;
  error: Error | null;
  onCreateAccount: (account: Omit<AcelleAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateAccount: (account: AcelleAccount) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onRefresh: () => void;
  onSelectAccount?: (account: AcelleAccount) => void;
  selectedAccountId?: string;
}

export default function AcelleAccountsTable({
  accounts,
  isLoading,
  error,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onRefresh,
  onSelectAccount,
  selectedAccountId
}: AcelleAccountsTableProps) {
  const [selectedAccount, setSelectedAccount] = useState<AcelleAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Utiliser le hook de filtrage pour les comptes
  const {
    filteredAccounts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  } = useAcelleAccountsFilter(accounts);

  const handleCreateAccount = async (formData: AcelleFormValues) => {
    try {
      setIsSubmitting(true);
      await onCreateAccount({
        name: formData.name,
        api_endpoint: formData.api_endpoint,
        api_token: formData.api_token,
        status: formData.status,
        missionId: formData.missionId,
        lastSyncDate: formData.lastSyncDate,
        lastSyncError: formData.lastSyncError,
        cachePriority: formData.cachePriority || 0,
      });
      setShowCreateForm(false);
      onRefresh();
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (formData: AcelleFormValues) => {
    if (!selectedAccount) return;
    
    try {
      setIsSubmitting(true);
      await onUpdateAccount({
        ...selectedAccount,
        name: formData.name,
        api_endpoint: formData.api_endpoint,
        api_token: formData.api_token,
        status: formData.status,
        missionId: formData.missionId,
        lastSyncDate: formData.lastSyncDate,
        lastSyncError: formData.lastSyncError,
        cachePriority: formData.cachePriority || 0,
      });
      setSelectedAccount(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      setIsSubmitting(true);
      await onDeleteAccount(id);
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge variant="success">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Jamais";
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">
            Erreur lors du chargement des comptes: {error.message}
          </div>
          <Button onClick={onRefresh} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full h-10 pl-3 pr-10 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ListFilter className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter || "all"}
              onChange={(e) => setStatusFilter(e.target.value === "all" ? null : e.target.value)}
              className="h-10 pl-3 pr-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="error">En erreur</option>
            </select>
          </div>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          Ajouter un compte
        </Button>
      </div>

      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">Aucun compte Acelle trouvé</div>
            {accounts.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Essayez de modifier vos filtres de recherche
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>API</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière synchronisation</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow 
                  key={account.id}
                  className={selectedAccountId === account.id ? "bg-primary/5" : undefined}
                  onClick={() => onSelectAccount && onSelectAccount(account)}
                  style={{ cursor: onSelectAccount ? 'pointer' : 'default' }}
                >
                  <TableCell className="font-medium">
                    {account.name}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {account.api_endpoint}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(account.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(account.lastSyncDate)}</span>
                    </div>
                    {account.lastSyncError && (
                      <div className="text-xs text-red-500 truncate max-w-[200px]" title={account.lastSyncError}>
                        {account.lastSyncError}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {account.cachePriority || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedAccount(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteConfirm(account.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de création */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un compte Acelle</DialogTitle>
            <DialogDescription>
              Connectez un nouveau compte Acelle à la plateforme.
            </DialogDescription>
          </DialogHeader>
          <AcelleAccountForm
            onSubmit={handleCreateAccount}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le compte Acelle</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du compte {selectedAccount?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <AcelleAccountForm
              account={selectedAccount}
              onSubmit={handleUpdateAccount}
              onCancel={() => setSelectedAccount(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce compte Acelle ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteConfirm && handleDeleteAccount(showDeleteConfirm)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
