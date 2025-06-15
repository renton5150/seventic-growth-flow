
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useMissionsQuery } from "@/hooks/useRequestQueries";
import { Domain } from "@/types/domains.types";

const formSchema = z.object({
  domain_name: z.string().min(1, "Le nom de domaine est requis"),
  mission_id: z.string().min(1, "Sélectionnez une mission"),
  hosting_provider: z.enum(['OVH', 'Gandhi', 'Ionos']),
  login: z.string().min(1, "Le login est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  creation_date: z.string().min(1, "La date de création est requise"),
  expiration_date: z.string().min(1, "La date d'expiration est requise"),
  status: z.enum(['Actif', 'Suspendu']),
});

type FormData = z.infer<typeof formSchema>;

interface DomainFormProps {
  domain?: Domain;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DomainForm = ({
  domain,
  onSubmit,
  onCancel,
  isLoading = false
}: DomainFormProps) => {
  const { data: missions } = useMissionsQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain_name: domain?.domain_name || "",
      mission_id: domain?.mission_id || "",
      hosting_provider: domain?.hosting_provider || 'OVH',
      login: domain?.login || "",
      password: "", // Toujours vide pour la sécurité
      creation_date: domain?.creation_date || "",
      expiration_date: domain?.expiration_date || "",
      status: domain?.status || 'Actif',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom de domaine */}
          <FormField
            control={form.control}
            name="domain_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de domaine *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="exemple.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mission */}
          <FormField
            control={form.control}
            name="mission_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mission *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une mission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {missions?.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} - {mission.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hébergeur */}
          <FormField
            control={form.control}
            name="hosting_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hébergeur *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="OVH">OVH</SelectItem>
                    <SelectItem value="Gandhi">Gandhi</SelectItem>
                    <SelectItem value="Ionos">Ionos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Login */}
          <FormField
            control={form.control}
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Login *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Identifiant hébergeur" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="text" 
                    placeholder={domain ? "Laisser vide pour conserver" : "Mot de passe"} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date de création */}
          <FormField
            control={form.control}
            name="creation_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de création *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date d'expiration */}
          <FormField
            control={form.control}
            name="expiration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date d'expiration *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Statut */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : domain ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
