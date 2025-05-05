
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { formSchema, AcelleFormValues } from "./schema";

interface UseAcelleFormProps {
  account?: AcelleAccount;
  onSuccess: (account: AcelleAccount, wasEditing: boolean) => void;
}

export function useAcelleForm({ account, onSuccess }: UseAcelleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!account;

  // Formulaire avec validation
  const form = useForm<AcelleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      api_endpoint: account?.api_endpoint || "",
      api_token: account?.api_token || "",
      cache_priority: account?.cache_priority || 0,
      status: (account?.status as "active" | "inactive" | "error") || "inactive",
    },
  });

  async function onSubmit(values: AcelleFormValues) {
    setIsSubmitting(true);
    
    try {
      const accountData: AcelleAccount = {
        name: values.name,
        api_endpoint: values.api_endpoint,
        api_token: values.api_token,
        status: values.status,
        cache_priority: values.cache_priority || 0,
        ...(account && {
          id: account.id,
          created_at: account.created_at,
          updated_at: new Date().toISOString(),
          last_sync_date: account.last_sync_date,
          last_sync_error: account.last_sync_error
        })
      };
      
      if (isEditing) {
        const { data, error } = await supabase
          .from('acelle_accounts')
          .update(accountData)
          .eq('id', account.id)
          .select()
          .single();
          
        if (error) throw new Error(error.message);
        
        toast.success("Compte mis à jour avec succès");
        onSuccess(data as AcelleAccount, true);
      } else {
        const { data, error } = await supabase
          .from('acelle_accounts')
          .insert([accountData])
          .select()
          .single();
          
        if (error) throw new Error(error.message);
        
        toast.success("Compte créé avec succès");
        onSuccess(data as AcelleAccount, false);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du compte:", error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : "Échec de l'opération"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    isSubmitting,
    isEditing,
    onSubmit
  };
}
