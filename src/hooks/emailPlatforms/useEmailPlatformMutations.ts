
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
      toast.error('Erreur lors de la création du compte');
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
      toast.error('Erreur lors de la mise à jour du compte');
    },
  });
};

export const useDeleteEmailPlatformAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmailPlatformAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-platform-accounts'] });
      toast.success('Compte supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du compte');
    },
  });
};
