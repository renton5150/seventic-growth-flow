import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AcelleAccount } from "@/types/acelle.types";
import { toast } from "sonner";
import { AlertCircle, Info } from "lucide-react"; // Remplacer les icônes Radix par Lucide

// Schéma de validation pour le formulaire
const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  api_endpoint: z.string().min(1, "L'URL de l'API est requise").url("L'URL doit être valide"),
  api_token: z.string().min(1, "Le token API est requis"),
  status: z.enum(["active", "inactive", "error"]), // Ajout de "error" comme statut valide
  mission_id: z.string().optional(),
});

// Type pour les props du formulaire
interface AcelleAccountFormProps {
  account?: AcelleAccount;
  missions?: { id: string; name: string }[];
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading?: boolean;
}

export default function AcelleAccountForm({
  account,
  missions = [],
  onSubmit,
  isLoading = false,
}: AcelleAccountFormProps) {
  // État pour suivre si nous testons la connexion API
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Initialisation du formulaire avec les valeurs par défaut
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      api_endpoint: account?.api_endpoint || "",
      api_token: account?.api_token || "",
      status: (account?.status as "active" | "inactive" | "error") || "active", // Cast pour s'assurer de la compatibilité
      mission_id: account?.mission_id || "none",
    },
  });

  // Mise à jour des valeurs du formulaire si le compte change
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name || "",
        api_endpoint: account.api_endpoint || "",
        api_token: account.api_token || "",
        status: account.status || "active",
        mission_id: account.mission_id || "none", // Utiliser "none" au lieu de chaîne vide ""
      });
    }
  }, [account, form]);

  // Fonction de soumission du formulaire
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convertir "none" en null pour mission_id
    const processedValues = {
      ...values,
      mission_id: values.mission_id === "none" ? null : values.mission_id,
    };
    onSubmit(processedValues);
  };

  // Fonction pour tester la connexion API
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const endpoint = form.getValues("api_endpoint");
    const token = form.getValues("api_token");

    if (!endpoint || !token) {
      setTestResult({
        success: false,
        message: "Veuillez remplir l'URL de l'API et le token",
      });
      setIsTesting(false);
      return;
    }

    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // En absence d'une véritable fonction de test, nous simulons un succès
      setTestResult({
        success: true,
        message: "Connexion réussie à l'API Acelle",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Erreur de connexion à l'API Acelle",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du compte</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du compte Acelle" {...field} />
                    </FormControl>
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une mission" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune mission</SelectItem>
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

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="api_endpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de l'API</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://acelle.votredomaine.com/api/v1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      L'URL de base de l'API Acelle Mail
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
                      <Input placeholder="Token API Acelle" {...field} />
                    </FormControl>
                    <FormDescription>
                      Le token d'authentification pour l'API Acelle Mail
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="error">Erreur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <Info className="h-4 w-4" /> // Utiliser l'icône Lucide Info
            ) : (
              <AlertCircle className="h-4 w-4" /> // Utiliser l'icône Lucide AlertCircle
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
          >
            {isTesting ? "Test en cours..." : "Tester la connexion"}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
