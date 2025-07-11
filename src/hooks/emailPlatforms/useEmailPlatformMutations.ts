
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
      // Invalider les comptes de plateformes email
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      // Invalider la liste des plateformes pour qu'elle se mette à jour avec la nouvelle plateforme
      queryClient.invalidateQueries({ queryKey: ['email-platforms'] });
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
    mutationFn: deleteEmailPlatformAccount,
    onSuccess: () => {
      // Invalider et refetch immédiatement
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      queryClient.refetchQueries({ queryKey: ['email-platform-accounts'] });
      toast.success('Compte supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error?.message || 'Erreur lors de la suppression du compte';
      toast.error(errorMessage);
    },
  });
};
