
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AcelleAccount } from "@/types/acelle.types";
import { ConnectionTester } from "./forms/ConnectionTester";
import { TextField, StatusField } from "./forms/FormFields";
import { useAcelleForm } from "./forms/useAcelleForm";

interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSuccess: (account: AcelleAccount, wasEditing: boolean) => void;
  onCancel: () => void;
}

export function AcelleAccountForm({ account, onSuccess, onCancel }: AcelleAccountFormProps) {
  const { form, isSubmitting, isEditing, onSubmit } = useAcelleForm({ account, onSuccess });
  const [apiEndpoint, setApiEndpoint] = useState(account?.api_endpoint || "");
  const [apiToken, setApiToken] = useState(account?.api_token || "");

  // Update connection test fields when form changes
  const handleApiEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("api_endpoint", value);
    setApiEndpoint(value);
  };

  const handleApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("api_token", value);
    setApiToken(value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          form={form}
          name="name"
          label="Nom"
          placeholder="Mon compte Acelle"
          description="Nom d'identification de ce compte"
        />
        
        <FormField
          control={form.control}
          name="api_endpoint"
          render={({ field }) => (
            <TextField
              form={form}
              name="api_endpoint"
              label="URL de l'API"
              placeholder="https://emailing.example.com/api/v1"
              description="URL de base de l'API Acelle (sans le slash final)"
              {...field}
              onChange={handleApiEndpointChange}
            />
          )}
        />
        
        <FormField
          control={form.control}
          name="api_token"
          render={({ field }) => (
            <TextField
              form={form}
              name="api_token"
              label="Token API"
              placeholder="votre-token-api"
              description="Token d'authentification pour accéder à l'API"
              type="password"
              {...field}
              onChange={handleApiTokenChange}
            />
          )}
        />
        
        <StatusField form={form} />
        
        <TextField
          form={form}
          name="cache_priority"
          label="Priorité de cache"
          placeholder="0"
          description="Priorité pour les opérations de mise en cache (plus élevé = priorité plus haute)"
          type="number"
        />
        
        <ConnectionTester 
          apiEndpoint={apiEndpoint} 
          apiToken={apiToken} 
        />
        
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? 'Mettre à jour' : 'Créer le compte'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
