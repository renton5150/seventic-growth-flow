import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllSupaMissions } from "@/services/missions";
import { AcelleAccount } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/acelle-service";

const formSchema = z.object({
  missionId: z.string({
    required_error: "Veuillez sélectionner une mission",
  }),
  name: z.string({
    required_error: "Veuillez saisir un nom",
  }).min(3, {
    message: "Le nom doit contenir au moins 3 caractères",
  }),
  apiEndpoint: z.string({
    required_error: "Veuillez saisir l'URL de l'API",
  }).url({
    message: "Veuillez saisir une URL valide",
  }),
  apiToken: z.string({
    required_error: "Veuillez saisir le token API",
  }).min(10, {
    message: "Le token API doit contenir au moins 10 caractères",
  }),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function AcelleAccountForm({
  account,
  onSubmit,
  onCancel,
  isSubmitting
}: AcelleAccountFormProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "failure">("untested");
  
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: getAllSupaMissions,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      missionId: account?.missionId || "",
      name: account?.name || "",
      apiEndpoint: account?.apiEndpoint || "",
      apiToken: account?.apiToken || "",
      status: account?.status || "inactive",
    },
  });

  const handleTestConnection = async () => {
    const apiEndpoint = form.getValues("apiEndpoint");
    const apiToken = form.getValues("apiToken");
    
    if (!apiEndpoint || !apiToken) {
      toast.error("Veuillez saisir l'URL de l'API et le token API");
      return;
    }
    
    setIsTestingConnection(true);
    setConnectionStatus("untested");
    
    try {
      const isConnected = await testAcelleConnection(apiEndpoint, apiToken);
      
      if (isConnected) {
        setConnectionStatus("success");
        toast.success("Connexion réussie à l'API Acelle Mail");
      } else {
        setConnectionStatus("failure");
        toast.error("Échec de la connexion à l'API Acelle Mail");
      }
    } catch (error) {
      setConnectionStatus("failure");
      toast.error("Erreur lors du test de connexion");
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="missionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id}>
                      {mission.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du compte</FormLabel>
              <FormControl>
                <Input placeholder="Compte Acelle Wenes" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="apiEndpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de l'API</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://emailing.plateforme-solution.net/api/v1" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="apiToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token API</FormLabel>
              <FormControl>
                <Input 
                  placeholder="SiWiMzuDxJuTIcOTMtBmfzYxdZ7HBlIqZU4zJIbVhtZp..." 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
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
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isTestingConnection || isSubmitting}
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Test en cours...
              </>
            ) : (
              "Tester la connexion"
            )}
          </Button>
          
          {connectionStatus === "success" && (
            <div className="flex items-center text-green-500">
              <Check className="h-4 w-4 mr-1" /> Connexion réussie
            </div>
          )}
          
          {connectionStatus === "failure" && (
            <div className="flex items-center text-red-500">
              <X className="h-4 w-4 mr-1" /> Échec de connexion
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : account ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
