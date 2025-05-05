
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { AcelleFormValues, AcelleAccountFormProps } from './AcelleAccountForm.types';

const AcelleAccountForm: React.FC<AcelleAccountFormProps> = ({ 
  account, 
  onSubmit, 
  onCancel,
  isSubmitting = false
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AcelleFormValues>({
    defaultValues: {
      name: account?.name || '',
      api_endpoint: account?.api_endpoint || '',
      api_token: account?.api_token || '',
      status: account?.status || 'inactive',
      mission_id: account?.mission_id || undefined,
      cache_priority: account?.cache_priority || 0,
    }
  });

  // Pour les champs qui utilisent Select, nous devons utiliser setValue
  React.useEffect(() => {
    if (account) {
      setValue('status', account.status);
    }
  }, [account, setValue]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{account ? `Modifier ${account.name}` : 'Nouveau compte Acelle'}</CardTitle>
        <CardDescription>
          {account 
            ? 'Modifiez les informations du compte Acelle' 
            : 'Renseignez les informations pour créer un compte Acelle'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Nom du compte */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du compte</Label>
            <Input
              id="name"
              placeholder="Ex: Client X - Marketing"
              {...register('name', { required: 'Le nom est obligatoire' })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          {/* API Endpoint */}
          <div className="space-y-2">
            <Label htmlFor="api_endpoint">URL de l'API Acelle</Label>
            <Input
              id="api_endpoint"
              placeholder="Ex: https://acelle.example.com/api/v1"
              {...register('api_endpoint', { required: "L'URL de l'API est obligatoire" })}
            />
            {errors.api_endpoint && <p className="text-sm text-red-500">{errors.api_endpoint.message}</p>}
          </div>
          
          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="api_token">Token API</Label>
            <Input
              id="api_token"
              type="password"
              placeholder="Token d'API Acelle"
              {...register('api_token', { required: "Le token API est obligatoire" })}
            />
            {errors.api_token && <p className="text-sm text-red-500">{errors.api_token.message}</p>}
          </div>
          
          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select 
              defaultValue={account?.status || 'inactive'} 
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'error')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
          </div>
          
          {/* Priorité de cache (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="cache_priority">Priorité de cache</Label>
            <Input
              id="cache_priority"
              type="number"
              placeholder="0"
              {...register('cache_priority', { 
                valueAsNumber: true,
                min: { value: 0, message: 'La priorité doit être un nombre positif' } 
              })}
            />
            <p className="text-xs text-gray-500">
              Optionnel. Définit la priorité du compte pour la synchronisation automatique.
            </p>
            {errors.cache_priority && <p className="text-sm text-red-500">{errors.cache_priority.message}</p>}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AcelleAccountForm;
