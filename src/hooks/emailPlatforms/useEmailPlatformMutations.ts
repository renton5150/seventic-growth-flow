
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  createEmailPlatformAccount, 
  updateEmailPlatformAccount, 
  deleteEmailPlatformAccount 
} from "@/services/emailPlatforms/emailPlatformService";
import { EmailPlatformAccountFormData } from "@/types/emailPlatforms.types";

export const useCreateEmailPlatformAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmailPlatformAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      toast.success('Compte créé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error?.message || 'Erreur lors de la création du compte';
      toast.error(errorMessage);
    },
  });
};

export const useUpdateEmailPlatformAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailPlatformAccountFormData> }) =>
      updateEmailPlatformAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      toast.success('Compte mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error?.message || 'Erreur lors de la mise à jour du compte';
      toast.error(errorMessage);
    },
  });
};

export const useDeleteEmailPlatformAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      console.log('useDeleteEmailPlatformAccount - Starting deletion for:', accountId);
      const result = await deleteEmailPlatformAccount(accountId);
      console.log('useDeleteEmailPlatformAccount - Deletion result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('useDeleteEmailPlatformAccount - onSuccess called with:', data);
      // Invalider toutes les requêtes liées aux comptes email
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      // Forcer un refetch immédiat
      queryClient.refetchQueries({ queryKey: ['email-platform-accounts'] });
      console.log('useDeleteEmailPlatformAccount - Queries invalidated and refetched');
      toast.success('Compte supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('useDeleteEmailPlatformAccount - onError called with:', error);
      const errorMessage = error?.message || 'Erreur lors de la suppression du compte';
      toast.error(errorMessage);
    },
  });
};
