
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useRequestAssignment = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Assigne une demande à l'utilisateur actuel
   */
  const assignRequestToMe = async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error("Erreur lors de la récupération de l'utilisateur:", userError);
        toast.error("Erreur lors de l'assignation: impossible de récupérer les informations utilisateur");
        return false;
      }
      
      const userId = userData.user.id;
      
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          assigned_to: userId,
          workflow_status: 'in_progress',
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (updateError) {
        console.error("Erreur lors de l'assignation de la demande:", updateError);
        toast.error("Erreur lors de l'assignation de la demande");
        return false;
      }
      
      toast.success("Demande assignée avec succès");
      
      // Force refresh all request queries
      queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
      queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("Erreur inattendue lors de l'assignation:", error);
      toast.error("Une erreur est survenue lors de l'assignation");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Met à jour le statut de workflow d'une demande
   */
  const updateRequestWorkflowStatus = async (requestId: string, newStatus: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          workflow_status: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut:", updateError);
        toast.error("Erreur lors de la mise à jour du statut");
        return false;
      }
      
      toast.success(`Statut mis à jour: ${newStatus}`);
      
      // Force refresh all request queries
      queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
      queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("Erreur inattendue lors de la mise à jour du statut:", error);
      toast.error("Une erreur est survenue lors de la mise à jour du statut");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assignRequestToMe,
    updateRequestWorkflowStatus,
    isLoading
  };
};
