
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmailPlatformAccountCard } from "@/components/email-platforms/EmailPlatformAccountCard";
import { EmailPlatformAccountForm } from "@/components/email-platforms/EmailPlatformAccountForm";
import { EmailPlatformAccountFilters } from "@/components/email-platforms/EmailPlatformAccountFilters";
import { useEmailPlatformAccounts } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { 
  useCreateEmailPlatformAccount, 
  useUpdateEmailPlatformAccount, 
  useDeleteEmailPlatformAccount 
} from "@/hooks/emailPlatforms/useEmailPlatformMutations";
import { useAuth } from "@/contexts/AuthContext";
import { EmailPlatformAccount, EmailPlatformAccountFilters as FiltersType, EmailPlatformAccountFormData } from "@/types/emailPlatforms.types";

export default function EmailPlatforms() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FiltersType>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailPlatformAccount | undefined>();
  const [accountToDelete, setAccountToDelete] = useState<string | undefined>();

  const { data: accounts, isLoading } = useEmailPlatformAccounts(filters);
  const createMutation = useCreateEmailPlatformAccount();
  const updateMutation = useUpdateEmailPlatformAccount();
  const deleteMutation = useDeleteEmailPlatformAccount();

  const canCreateAccount = user?.role === 'admin' || user?.role === 'growth';

  const handleCreateAccount = () => {
    setEditingAccount(undefined);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: EmailPlatformAccount) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccountToDelete(accountId);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate(accountToDelete, {
        onSuccess: () => {
          setAccountToDelete(undefined);
        }
      });
    }
  };

  const handleFormSubmit = (data: EmailPlatformAccountFormData) => {
    if (editingAccount) {
      // Mise à jour
      const updateData = { ...data };
      // Si le mot de passe est vide, on ne le met pas à jour
      if (!data.password) {
        delete updateData.password;
      }
      
      updateMutation.mutate(
        { id: editingAccount.id, data: updateData },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingAccount(undefined);
          }
        }
      );
    } else {
      // Création
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        }
      });
    }
  };

  const filteredAccounts = accounts?.filter(account => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        account.login.toLowerCase().includes(searchLower) ||
        account.platform?.name.toLowerCase().includes(searchLower) ||
        account.mission?.name.toLowerCase().includes(searchLower) ||
        account.mission?.client.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Comptes Plateformes d'Emailing"
        description="Gérez et suivez vos comptes sur les différentes plateformes d'emailing"
        action={
          canCreateAccount ? (
            <Button onClick={handleCreateAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compte
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <EmailPlatformAccountFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />

        {isLoading ? (
          <div className="text-center py-12">
            <p>Chargement des comptes...</p>
          </div>
        ) : filteredAccounts && filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <EmailPlatformAccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {accounts?.length === 0 
                ? "Aucun compte créé pour le moment" 
                : "Aucun compte ne correspond aux filtres appliqués"
              }
            </p>
            {canCreateAccount && accounts?.length === 0 && (
              <Button onClick={handleCreateAccount} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier compte
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialog de création/édition */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Modifier le compte" : "Nouveau compte"}
            </DialogTitle>
          </DialogHeader>
          <EmailPlatformAccountForm
            account={editingAccount}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
