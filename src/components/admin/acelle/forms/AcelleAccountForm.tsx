
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { AcelleAccount } from "@/types/acelle.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema de validation
const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  api_endpoint: z.string().url("L'URL de l'API doit être valide"),
  api_token: z.string().min(8, "Le token API doit contenir au moins 8 caractères"),
  status: z.enum(["active", "inactive"]),
  mission_id: z.string().optional(),
  cache_priority: z.number().int().nonnegative().optional(),
});

interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  missions?: Array<{ id: string; name: string }>;
  isSubmitting?: boolean;
}

export function AcelleAccountForm({ 
  account, 
  onSubmit, 
  onCancel, 
  missions = [],
  isSubmitting = false
}: AcelleAccountFormProps) {
  // Initialiser le formulaire
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      api_endpoint: account?.api_endpoint || "",
      api_token: account?.api_token || "",
      status: account?.status as "active" | "inactive" || "inactive",
      mission_id: account?.mission_id || "",
      cache_priority: account?.cache_priority || 0,
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Valider les données et envoyer
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du compte</FormLabel>
              <FormControl>
                <Input placeholder="Mon compte Acelle" {...field} />
              </FormControl>
              <FormDescription>
                Un nom pour identifier ce compte Acelle
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
              <FormLabel>URL API</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://acelle.monsite.com/api/v1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                L'URL de base de l'API Acelle (sans slash à la fin)
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
                  type="password" 
                  placeholder="Token d'authentification API" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Le token API généré depuis l'interface Acelle
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
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Définit si le compte est actif ou non
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mission_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission associée</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une mission (optionnel)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id}>
                      {mission.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Associer ce compte à une mission (optionnel)
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
                  min={0}
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Priorité pour la synchronisation du cache (0 = normale)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enregistrement..." : account ? "Mettre à jour" : "Créer le compte"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
