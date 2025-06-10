import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmailPlatformAccountForm } from "@/components/email-platforms/EmailPlatformAccountForm";
import { EmailPlatformAccountsTable } from "@/components/email-platforms/EmailPlatformAccountsTable";
import { useEmailPlatformAccounts } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { 
  useCreateEmailPlatformAccount, 
  useUpdateEmailPlatformAccount, 
  useDeleteEmailPlatformAccount 
} from "@/hooks/emailPlatforms/useEmailPlatformMutations";
import { useAuth } from "@/contexts/AuthContext";
import { EmailPlatformAccount, EmailPlatformAccountFormData } from "@/types/emailPlatforms.types";
import { AppLayout } from "@/components/layout/AppLayout";

function EmailPlatformsContent() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailPlatformAccount | undefined>();
  const [accountToDelete, setAccountToDelete] = useState<string | undefined>();

  const { data: accounts, isLoading } = useEmailPlatformAccounts();
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
    console.log('Delete account requested for ID:', accountId);
    setAccountToDelete(accountId);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      console.log('Confirming delete for account ID:', accountToDelete);
      deleteMutation.mutate(accountToDelete, {
        onSuccess: () => {
          console.log('Account deleted successfully');
          setAccountToDelete(undefined);
        },
        onError: (error) => {
          console.error('Error deleting account:', error);
          // Keep the dialog open so user can see the error and try again
        }
      });
    }
  };

  const handleFormSubmit = (data: EmailPlatformAccountFormData) => {
    console.log('Form submission data:', data);
    
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

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingAccount(undefined);
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Comptes Plateformes d'Emailing"
        description="Gérez et suivez vos comptes sur les différentes plateformes d'emailing. Une mission peut avoir plusieurs plateformes, et chaque plateforme a son propre statut."
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
        {isLoading ? (
          <div className="text-center py-12">
            <p>Chargement des comptes...</p>
          </div>
        ) : accounts && accounts.length > 0 ? (
          <EmailPlatformAccountsTable
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun compte créé pour le moment</p>
            {canCreateAccount && (
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
            onCancel={handleFormCancel}
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailPlatforms() {
  return (
    <AppLayout>
      <EmailPlatformsContent />
    </AppLayout>
  );
}
