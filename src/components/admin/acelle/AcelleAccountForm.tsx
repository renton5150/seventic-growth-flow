import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { testAcelleConnection } from "@/services/acelle/api/connection";

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom du compte doit comporter au moins 2 caractères.",
  }),
  api_endpoint: z.string().url({
    message: "L'URL de l'API doit être valide.",
  }),
  api_token: z.string().min(10, {
    message: "Le token API doit comporter au moins 10 caractères.",
  }),
  cache_priority: z.number().int().default(0),
  status: z.enum(["active", "inactive", "error"]).default("inactive"),
});

interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSuccess: (account: AcelleAccount, wasEditing: boolean) => void;
  onCancel: () => void;
}

export function AcelleAccountForm({ account, onSuccess, onCancel }: AcelleAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<AcelleConnectionDebug | null>(null);
  const isEditing = !!account;

  // Formulaire avec validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      api_endpoint: account?.api_endpoint || "",
      api_token: account?.api_token || "",
      cache_priority: account?.cache_priority || 0,
      status: (account?.status as "active" | "inactive" | "error") || "inactive",
    },
  });

  async function testConnection() {
    setIsTesting(true);
    setConnectionResult(null);
    
    try {
      const { api_endpoint, api_token } = form.getValues();
      
      if (!api_endpoint || !api_token) {
        toast.error("Veuillez remplir les champs URL API et Token API");
        return;
      }
      
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        toast.error("Erreur d'authentification");
        return;
      }
      
      const result = await testAcelleConnection(api_endpoint, api_token, token);
      
      setConnectionResult(result);
      
      if (result.success) {
        toast.success("Connexion réussie à l'API Acelle");
      } else {
        toast.error(`La connexion a échoué: ${result.errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMessage}`);
      setConnectionResult({
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Mon compte Acelle" {...field} />
              </FormControl>
              <FormDescription>
                Nom d'identification de ce compte
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="api_endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de l'API</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://emailing.example.com/api/v1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                URL de base de l'API Acelle (sans le slash final)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="api_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token API</FormLabel>
              <FormControl>
                <Input 
                  placeholder="votre-token-api" 
                  {...field} 
                  type="password"
                />
              </FormControl>
              <FormDescription>
                Token d'authentification pour accéder à l'API
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <FormControl>
                <select 
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...field}
                >
                  <option value="inactive">Inactif</option>
                  <option value="active">Actif</option>
                  <option value="error">Erreur</option>
                </select>
              </FormControl>
              <FormDescription>
                Statut du compte (Actif pour le compte principal)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cache_priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priorité de cache</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value))} 
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                Priorité pour les opérations de mise en cache (plus élevé = priorité plus haute)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2">
          <Button type="button" onClick={testConnection} disabled={isTesting} className="flex-1">
            {isTesting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Tester la connexion
          </Button>
        </div>
        
        {connectionResult && (
          <Card className={connectionResult.success ? 'bg-green-50' : 'bg-red-50'}>
            <CardContent className="p-4">
              <p className={`font-medium ${connectionResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {connectionResult.success ? 'Connexion réussie' : `Échec de la connexion: ${connectionResult.errorMessage}`}
              </p>
              {connectionResult.success && connectionResult.apiVersion && (
                <p className="mt-1 text-sm text-green-600">Version API: {connectionResult.apiVersion}</p>
              )}
              {connectionResult.success && connectionResult.responseTime && (
                <p className="mt-1 text-sm text-green-600">Temps de réponse: {connectionResult.responseTime} ms</p>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            {isEditing ? 'Mettre à jour' : 'Créer le compte'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
