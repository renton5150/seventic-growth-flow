
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Request } from "@/types/types";
import { toast } from "sonner";

export function useRequestAssignment(onRequestUpdated: () => void) {
  const assignRequestToMe = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          assigned_to: (await supabase.auth.getUser()).data.user?.id,
          workflow_status: 'in_progress',
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Erreur lors de la prise en charge de la requête:", error);
        return false;
      }
      
      // Notify the SDR
      const { data: request } = await supabase
        .from('requests')
        .select('*, profiles:created_by(email)')
        .eq('id', requestId)
        .single();

      if (request && request.profiles && request.profiles.email) {
        toast.success("Le SDR a été notifié du changement de statut");
      }
      
      onRequestUpdated();
      return true;
    } catch (err) {
      console.error("Erreur lors de l'assignation de la requête:", err);
      return false;
    }
  };
  
  const updateRequestWorkflowStatus = async (requestId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          workflow_status: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du statut de la requête:", error);
        return false;
      }

      // Notify the SDR about the status change
      const { data: request } = await supabase
        .from('requests')
        .select('*, profiles:created_by(email)')
        .eq('id', requestId)
        .single();

      if (request && request.profiles && request.profiles.email) {
        toast.success("Le SDR a été notifié du changement de statut");
      }
      
      onRequestUpdated();
      return true;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      return false;
    }
  };

  return {
    assignRequestToMe,
    updateRequestWorkflowStatus
  };
}
