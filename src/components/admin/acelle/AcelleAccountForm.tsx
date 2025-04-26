
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Loader2, Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMissions } from "@/services/missions";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/acelle-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCampaignSync } from "@/hooks/acelle/useCampaignSync";

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
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [hasTriedWakeup, setHasTriedWakeup] = useState(false);
  
  const { wakeUpEdgeFunctions } = useCampaignSync();
  
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: getMissions,
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

  // Effet pour nettoyer le statut de connexion si les champs importants changent
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'apiEndpoint' || name === 'apiToken') {
        if (connectionStatus !== 'untested') {
          setConnectionStatus('untested');
          setDebugInfo(null);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, connectionStatus]);

  // Fonction pour tenter de réveiller les services edge
  const handleWakeUpServices = async () => {
    toast.loading("Réveil des services en cours...", { id: "wakeup-toast" });
    setHasTriedWakeup(true);
    
    try {
      const result = await wakeUpEdgeFunctions();
      
      if (result) {
        toast.success("Services initialisés avec succès", { id: "wakeup-toast" });
      } else {
        toast.warning("Services en cours d'initialisation, veuillez réessayer dans quelques instants", { id: "wakeup-toast" });
      }
    } catch (error) {
      toast.error("Erreur lors de l'initialisation des services", { id: "wakeup-toast" });
    }
  };

  const handleTestConnection = async () => {
    const apiEndpoint = form.getValues("apiEndpoint");
    const apiToken = form.getValues("apiToken");
    
    if (!apiEndpoint || !apiToken) {
      toast.error("Veuillez saisir l'URL de l'API et le token API");
      return;
    }
    
    setIsTestingConnection(true);
    setConnectionStatus("untested");
    setDebugInfo(null);
    
    try {
      const result = await testAcelleConnection(apiEndpoint, apiToken, debugMode);
      
      if (debugMode && typeof result !== 'boolean') {
        setDebugInfo(result);
        setConnectionStatus(result.success ? "success" : "failure");
        
        if (result.success) {
          toast.success("Connexion réussie à l'API Acelle Mail");
        } else {
          toast.error(`Échec de la connexion: ${result.errorMessage || "Erreur inconnue"}`);
        }
      } else if (typeof result === 'boolean') {
        setConnectionStatus(result ? "success" : "failure");
        
        if (result) {
          toast.success("Connexion réussie à l'API Acelle Mail");
        } else {
          toast.error("Échec de la connexion à l'API Acelle Mail");
        }
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
                  {Array.isArray(missions) ? missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id}>
                      {mission.name}
                    </SelectItem>
                  )) : null}
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
              <FormDescription className="text-xs text-muted-foreground">
                Exemple: https://emailing.plateforme-solution.net/api/v1
              </FormDescription>
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
                  placeholder="E7yCMWfRiDD1Gd4ycEAk4g0iQrCJFLgLIARgJ56KtBfKpXuQVkSep0OTacWB..." 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Vérifiez que le token est correctement copié depuis votre compte Acelle Mail
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
        
        {connectionStatus === "failure" && !hasTriedWakeup && (
          <Alert variant="warning" className="bg-amber-50">
            <AlertTitle className="text-amber-800">Problème de connexion</AlertTitle>
            <AlertDescription className="text-amber-700">
              Les services Edge Functions sont peut-être en veille. Essayez de les réveiller avant de réessayer.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 bg-amber-100 hover:bg-amber-200 mt-2"
                onClick={handleWakeUpServices}
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Réveiller les services
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-start gap-2 flex-wrap">
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
          
          <div className="flex items-center ml-2">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={debugMode} 
                onChange={() => setDebugMode(!debugMode)}
                className="mr-2"
              />
              <span className="text-sm">Mode debug</span>
            </label>
          </div>
          
          {debugInfo && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-blue-500">
                  <Info className="h-4 w-4" /> Voir les détails du debug
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Informations de débogage</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Requête</h3>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                        {JSON.stringify(debugInfo.request, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">
                        Statut: {debugInfo.statusCode || 'N/A'} 
                        {debugInfo.success ? 
                          <span className="text-green-500 ml-2">(Succès)</span> : 
                          <span className="text-red-500 ml-2">(Échec)</span>
                        }
                      </h3>
                    </div>
                    
                    {debugInfo.errorMessage && (
                      <div>
                        <h3 className="font-medium">Message d'erreur</h3>
                        <div className="bg-red-50 text-red-700 p-3 rounded-md">
                          {debugInfo.errorMessage}
                        </div>
                      </div>
                    )}
                    
                    {debugInfo.responseData && (
                      <div>
                        <h3 className="font-medium">Réponse</h3>
                        <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                          {typeof debugInfo.responseData === 'object' 
                            ? JSON.stringify(debugInfo.responseData, null, 2) 
                            : debugInfo.responseData
                          }
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium">Comment tester avec Curl</h3>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
                        {`curl -v -X GET "${debugInfo.request?.url}"`}
                      </pre>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Si cette requête fonctionne avec curl mais pas depuis le navigateur, 
                        il s'agit probablement d'un problème CORS. Vérifiez que votre serveur Acelle API est 
                        correctement configuré pour accepter les requêtes CORS depuis cette origine.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
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
