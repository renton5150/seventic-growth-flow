
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AcelleFormValues, AcelleAccountFormProps } from './AcelleAccountForm.types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { testAcelleConnection } from '@/services/acelle/api/connection';
import { AcelleConnectionDebug } from '@/types/acelle.types';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, "Le nom du compte est requis"),
  api_endpoint: z.string().min(1, "L'URL de l'API est requise").url("L'URL n'est pas valide"),
  api_token: z.string().min(1, "Le token API est requis"),
  status: z.enum(['active', 'inactive', 'error']).default('inactive'),
  missionId: z.string().optional(),
  lastSyncError: z.string().nullable().optional(),
  cachePriority: z.number().int().min(0).default(0).optional(),
  lastSyncDate: z.string().nullable().optional(),
});

const AcelleAccountForm = ({
  account,
  onSubmit,
  onCancel,
  isSubmitting = false
}: AcelleAccountFormProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    details?: AcelleConnectionDebug;
  } | null>(null);
  
  // Configure le formulaire avec les valeurs de compte par défaut
  const form = useForm<AcelleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || '',
      api_endpoint: account?.api_endpoint || '',
      api_token: account?.api_token || '',
      status: account?.status || 'inactive',
      missionId: account?.missionId || '',
      lastSyncError: account?.lastSyncError || null,
      cachePriority: account?.cachePriority || 0,
      lastSyncDate: account?.lastSyncDate || null,
    },
  });

  // Test la connexion à l'API Acelle
  const testConnection = async () => {
    try {
      setIsConnecting(true);
      setConnectionResult(null);
      
      const testAccount = {
        id: account?.id || 'system-test',
        name: form.getValues('name'),
        api_endpoint: form.getValues('api_endpoint'),
        api_token: form.getValues('api_token'),
        status: form.getValues('status') as 'active' | 'inactive' | 'error',
        created_at: '',
        lastSyncDate: null,
        lastSyncError: null,
        cachePriority: 0,
      };

      const result = await testAcelleConnection(testAccount);
      
      if (result.success) {
        setConnectionResult({
          success: true,
          message: "Connexion établie avec succès",
          details: result
        });
        
        // Définir le statut sur actif si la connexion est réussie
        form.setValue('status', 'active');
      } else {
        setConnectionResult({
          success: false,
          message: `Échec de la connexion: ${result.errorMessage}`,
          details: result
        });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setConnectionResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (data: AcelleFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du compte</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Acelle Production" />
                    </FormControl>
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
                      <Input {...field} placeholder="https://acelle.example.com/api/v1" />
                    </FormControl>
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
                      <Input {...field} type="password" placeholder="Token d'authentification API" />
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Compte actif</FormLabel>
                      <FormControl>
                        <Switch 
                          checked={field.value === 'active'} 
                          onCheckedChange={(checked) => {
                            form.setValue('status', checked ? 'active' : 'inactive');
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cachePriority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité du cache</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testConnection}
                  disabled={isConnecting}
                >
                  {isConnecting && <Spinner className="mr-2 h-4 w-4" />}
                  Tester la connexion
                </Button>
                
                {connectionResult && (
                  <Card className={connectionResult.success ? "bg-green-50" : "bg-red-50"}>
                    <CardContent className="p-4">
                      <div className={`font-medium ${connectionResult.success ? "text-green-600" : "text-red-600"}`}>
                        {connectionResult.message}
                      </div>
                      {connectionResult.details && (
                        <div className="mt-2 text-xs">
                          <div>Status: {connectionResult.details.statusCode}</div>
                          <div>Durée: {connectionResult.details.duration}ms</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {account ? "Mettre à jour" : "Créer le compte"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default AcelleAccountForm;
