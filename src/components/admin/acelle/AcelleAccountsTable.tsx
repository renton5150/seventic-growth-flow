import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit, Trash2, RefreshCw, Check, X, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getAcelleAccounts, deleteAcelleAccount, createAcelleAccount, updateAcelleAccount, getAcelleCampaigns } from "@/services/acelle/acelle-service";
import { AcelleAccount } from "@/types/acelle.types";
import AcelleAccountForm from "./AcelleAccountForm";
import { toast } from "sonner";

export default function AcelleAccountsTable() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AcelleAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const { data: accounts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["acelleAccounts"],
    queryFn: getAcelleAccounts,
  });

  const handleAddAccount = async (data: Omit<AcelleAccount, "id" | "createdAt" | "updatedAt" | "lastSyncDate">) => {
    setIsSubmitting(true);
    try {
      const newAccount = await createAcelleAccount({
        ...data,
        lastSyncDate: null
      });
      
      if (newAccount) {
        setIsAddDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["acelleAccounts"] });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du compte:", error);
      toast.error("Erreur lors de l'ajout du compte");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async (data: Omit<AcelleAccount, "id" | "createdAt" | "updatedAt" | "lastSyncDate">) => {
    if (!selectedAccount) return;
    
    setIsSubmitting(true);
    try {
      const updatedAccount = await updateAcelleAccount({
        ...selectedAccount,
        ...data,
        lastSyncDate: selectedAccount.lastSyncDate
      });
      
      if (updatedAccount) {
        setIsEditDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["acelleAccounts"] });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du compte:", error);
      toast.error("Erreur lors de la mise à jour du compte");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
    try {
      const success = await deleteAcelleAccount(selectedAccount.id);
      
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["acelleAccounts"] });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleRefreshAccount = async (account: AcelleAccount) => {
    setRefreshingId(account.id);
    try {
      await getAcelleCampaigns(account);
      toast.success(`Données synchronisées pour ${account.name}`);
      queryClient.invalidateQueries({ queryKey: ["acelleAccounts"] });
    } catch (error) {
      console.error(`Erreur lors de la synchronisation pour ${account.name}:`, error);
      toast.error(`Échec de la synchronisation pour ${account.name}`);
    } finally {
      setRefreshingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des comptes</p>
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Comptes Acelle Mail</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Ajouter un compte</Button>
      </div>
      
      {accounts.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">Aucun compte Acelle Mail configuré</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Ajouter votre premier compte
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>URL API</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière synchronisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.missionName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {account.apiEndpoint}
                  </TableCell>
                  <TableCell>
                    {account.status === "active" ? (
                      <Badge className="bg-green-500">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {account.lastSyncDate 
                      ? format(new Date(account.lastSyncDate), "dd/MM/yyyy HH:mm", { locale: fr }) 
                      : "Jamais"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRefreshAccount(account)}
                        disabled={refreshingId === account.id}
                      >
                        {refreshingId === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogue d'ajout de compte */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un compte Acelle Mail</DialogTitle>
          </DialogHeader>
          <AcelleAccountForm
            onSubmit={handleAddAccount}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue de modification de compte */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le compte Acelle Mail</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <AcelleAccountForm
              account={selectedAccount}
              onSubmit={handleEditAccount}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression de compte */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte "{selectedAccount?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
