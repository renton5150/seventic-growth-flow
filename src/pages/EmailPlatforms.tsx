
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmailPlatformAccountForm } from "@/components/email-platforms/EmailPlatformAccountForm";
import { EmailPlatformAccountsTable } from "@/components/email-platforms/EmailPlatformAccountsTable";
import { DomainsTable } from "@/components/domains/DomainsTable";
import { DomainForm } from "@/components/domains/DomainForm";
import { useEmailPlatformAccounts } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { useDomains } from "@/hooks/domains/useDomains";
import { 
  useCreateEmailPlatformAccount, 
  useUpdateEmailPlatformAccount, 
  useDeleteEmailPlatformAccount 
} from "@/hooks/emailPlatforms/useEmailPlatformMutations";
import {
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain
} from "@/hooks/domains/useDomainMutations";
import { useAuth } from "@/contexts/AuthContext";
import { EmailPlatformAccount, EmailPlatformAccountFormData } from "@/types/emailPlatforms.types";
import { Domain, DomainFormData } from "@/types/domains.types";
import { AppLayout } from "@/components/layout/AppLayout";

function EmailPlatformsContent() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailPlatformAccount | undefined>();
  const [accountToDelete, setAccountToDelete] = useState<string | undefined>();
  
  // Domain state
  const [isDomainFormOpen, setIsDomainFormOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | undefined>();
  const [domainToDelete, setDomainToDelete] = useState<string | undefined>();

  const { data: accounts, isLoading, refetch } = useEmailPlatformAccounts();
  const { data: domains, isLoading: domainsLoading, refetch: refetchDomains } = useDomains();
  
  const createMutation = useCreateEmailPlatformAccount();
  const updateMutation = useUpdateEmailPlatformAccount();
  const deleteMutation = useDeleteEmailPlatformAccount();
  
  const createDomainMutation = useCreateDomain();
  const updateDomainMutation = useUpdateDomain();
  const deleteDomainMutation = useDeleteDomain();

  const canCreateAccount = user?.role === 'admin' || user?.role === 'growth';

  // Email Platform Account handlers
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

  const confirmDeleteAccount = async () => {
    if (accountToDelete) {
      try {
        await deleteMutation.mutateAsync(accountToDelete);
        setAccountToDelete(undefined);
        await refetch();
      } catch (error) {
        console.error('Error during deletion:', error);
      }
    }
  };

  const handleFormSubmit = (data: EmailPlatformAccountFormData) => {
    if (editingAccount) {
      const updateData = { ...data };
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

  // Domain handlers
  const handleCreateDomain = () => {
    setEditingDomain(undefined);
    setIsDomainFormOpen(true);
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setIsDomainFormOpen(true);
  };

  const handleDeleteDomain = (domainId: string) => {
    setDomainToDelete(domainId);
  };

  const confirmDeleteDomain = async () => {
    if (domainToDelete) {
      try {
        await deleteDomainMutation.mutateAsync(domainToDelete);
        setDomainToDelete(undefined);
        await refetchDomains();
      } catch (error) {
        console.error('Error during domain deletion:', error);
      }
    }
  };

  const handleDomainFormSubmit = (data: DomainFormData) => {
    if (editingDomain) {
      const updateData = { ...data };
      if (!data.password) {
        delete updateData.password;
      }
      
      updateDomainMutation.mutate(
        { id: editingDomain.id, data: updateData },
        {
          onSuccess: () => {
            setIsDomainFormOpen(false);
            setEditingDomain(undefined);
          }
        }
      );
    } else {
      createDomainMutation.mutate(data, {
        onSuccess: () => {
          setIsDomainFormOpen(false);
        }
      });
    }
  };

  const handleDomainFormCancel = () => {
    setIsDomainFormOpen(false);
    setEditingDomain(undefined);
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

        {/* Section Domaines */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Noms de domaines disponibles</h2>
              <p className="text-gray-600 mt-1">
                Gérez les domaines utilisés pour vos campagnes d'emailing
              </p>
            </div>
            {canCreateAccount && (
              <Button onClick={handleCreateDomain}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau domaine
              </Button>
            )}
          </div>

          {domainsLoading ? (
            <div className="text-center py-12">
              <p>Chargement des domaines...</p>
            </div>
          ) : domains && domains.length > 0 ? (
            <DomainsTable
              domains={domains}
              onEdit={handleEditDomain}
              onDelete={handleDeleteDomain}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun domaine créé pour le moment</p>
              {canCreateAccount && (
                <Button onClick={handleCreateDomain} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier domaine
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de création/édition des comptes */}
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

      {/* Dialog de création/édition des domaines */}
      <Dialog open={isDomainFormOpen} onOpenChange={setIsDomainFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDomain ? "Modifier le domaine" : "Nouveau domaine"}
            </DialogTitle>
          </DialogHeader>
          <DomainForm
            domain={editingDomain}
            onSubmit={handleDomainFormSubmit}
            onCancel={handleDomainFormCancel}
            isLoading={createDomainMutation.isPending || updateDomainMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression des comptes */}
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
              onClick={confirmDeleteAccount}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression des domaines */}
      <AlertDialog open={!!domainToDelete} onOpenChange={() => setDomainToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce domaine ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDomainMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDomain}
              disabled={deleteDomainMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDomainMutation.isPending ? "Suppression..." : "Supprimer"}
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
