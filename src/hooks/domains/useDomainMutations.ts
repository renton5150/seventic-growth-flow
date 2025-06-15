
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  createDomain, 
  updateDomain, 
  deleteDomain 
} from "@/services/domains/domainService";
import { DomainFormData } from "@/types/domains.types";

export const useCreateDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domaine créé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error?.message || 'Erreur lors de la création du domaine';
      toast.error(errorMessage);
    },
  });
};

export const useUpdateDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DomainFormData> }) =>
      updateDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domaine mis à jour avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error?.message || 'Erreur lors de la mise à jour du domaine';
      toast.error(errorMessage);
    },
  });
};

export const useDeleteDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domaine supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error?.message || 'Erreur lors de la suppression du domaine';
      toast.error(errorMessage);
    },
  });
};
