
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { useQuery } from "@tanstack/react-query";
import { getMissions } from "@/services/mission";
import { AcelleFormValues, AcelleAccountFormProps } from "./AcelleAccountForm.types";

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  api_endpoint: z.string().url({ message: "L'URL de l'API doit être valide" }),
  api_token: z.string().min(5, { message: "Le token API doit contenir au moins 5 caractères" }),
  status: z.enum(["active", "inactive", "error"]),
  missionId: z.string().optional(),
});

const AcelleAccountForm = ({ account, onSubmit, onCancel, isSubmitting = false }: AcelleAccountFormProps) => {
  const [isConnectionLoading, setIsConnectionLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [connectionDebugInfo, setConnectionDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [advancedDebug, setAdvancedDebug] = useState(false);

  const form = useForm<AcelleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      api_endpoint: account?.api_endpoint || "",
      api_token: account?.api_token || "",
      status: account?.status || "inactive",
      missionId: account?.missionId || "none",
    },
  });

  // Fetch missions for dropdown
  const { data: missions = [] } = useQuery({
    queryKey: ["missionsForAccountForm"],
    queryFn: getMissions,
    staleTime: 60000,
  });

  // Test API connection - fixed to use only one argument
  const testConnection = async () => {
    const api_endpoint = form.getValues("api_endpoint");
    const api_token = form.getValues("api_token");
    
    if (!api_endpoint || !api_token) {
      form.trigger(["api_endpoint", "api_token"]);
      return;
    }

    setIsConnectionLoading(true);
    setConnectionStatus(null);
    setConnectionDebugInfo(null);

    try {
      // Create a temporary account object for testing
      const testAccount = {
        id: "temp-id",
        api_endpoint,
        api_token,
        name: "Test Connection",
        status: "inactive" as "active" | "inactive" | "error",
        created_at: new Date().toISOString(),
        lastSyncDate: null,
        lastSyncError: null,
        cachePriority: 0
      };
      
      const result = await testAcelleConnection(testAccount);
      setConnectionStatus(result.success);
      setConnectionDebugInfo(result);
      
      if (result.success) {
        form.setValue("status", "active");
      } else {
        form.setValue("status", "error");
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionStatus(false);
      form.setValue("status", "error");
    } finally {
      setIsConnectionLoading(false);
    }
  };

  // Handle submit
  const handleSubmit = (values: AcelleFormValues) => {
    // Si la mission est "none", remplacer par null pour la base de données
    if (values.missionId === "none") {
      values.missionId = null;
    }
    onSubmit(values);
  };

  // Connection status indicator component
  const ConnectionStatusIndicator = () => {
    if (connectionStatus === null) {
      return null;
    }

    if (connectionStatus) {
      return (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Connexion réussie</AlertTitle>
          <AlertDescription className="text-green-700">
            L'API Acelle est accessible et fonctionnelle.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="mt-4 bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Échec de connexion</AlertTitle>
        <AlertDescription className="text-red-700">
          Impossible de se connecter à l'API Acelle. Veuillez vérifier les informations saisies.
          <Button 
            variant="link" 
            className="p-0 h-auto text-red-700 underline"
            onClick={() => setAdvancedDebug(!advancedDebug)}
          >
            {advancedDebug ? "Masquer les détails" : "Afficher les détails"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  // Debug information section
  const DebugInfoSection = () => {
    if (!advancedDebug || !connectionDebugInfo) {
      return null;
    }

    return (
      <div className="mt-4 bg-gray-50 p-4 rounded border text-xs font-mono overflow-x-auto">
        <h4 className="font-semibold mb-2">Informations de débogage</h4>
        <div className="space-y-2">
          <div>
            <strong>Statut:</strong> {connectionDebugInfo.statusCode || "N/A"}
          </div>
          <div>
            <strong>Erreur:</strong> {connectionDebugInfo.errorMessage || "Aucune erreur"}
          </div>
          <div>
            <strong>Requête:</strong>
            <pre className="mt-1 bg-gray-100 p-2 rounded">
              {JSON.stringify(connectionDebugInfo.request || {}, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Réponse:</strong>
            <pre className="mt-1 bg-gray-100 p-2 rounded">
              {connectionDebugInfo.responseData ? 
                (typeof connectionDebugInfo.responseData === 'object' 
                  ? JSON.stringify(connectionDebugInfo.responseData, null, 2)
                  : connectionDebugInfo.responseData)
                : "Aucune donnée"}
            </pre>
          </div>
        </div>
      </div>
    );
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
                <Input {...field} placeholder="Mon compte Acelle" />
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
                <Input {...field} placeholder="https://emailing.entreprise.fr" />
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
                <Input {...field} placeholder="token-api-acelle" type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={isConnectionLoading}
          >
            {isConnectionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              "Tester la connexion"
            )}
          </Button>
        </div>

        <ConnectionStatusIndicator />
        <DebugInfoSection />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
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
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="missionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission associée (optionnel)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "none"} // Utiliser "none" au lieu de ""
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une mission" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucune mission</SelectItem> {/* Changé de "" à "none" */}
                  {missions.map((mission: any) => (
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {account ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              account ? "Mettre à jour" : "Créer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AcelleAccountForm;
