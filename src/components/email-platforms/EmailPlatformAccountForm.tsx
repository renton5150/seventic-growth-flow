
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useEmailPlatforms, useFrontOffices } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { useMissionsQuery } from "@/hooks/useRequestQueries";
import { EmailPlatformAccount, ROUTING_INTERFACES } from "@/types/emailPlatforms.types";

const formSchema = z.object({
  mission_id: z.string().min(1, "Sélectionnez une mission"),
  platform_id: z.string().min(1, "Sélectionnez une plateforme"),
  login: z.string().min(1, "Le login est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  phone_number: z.string().optional(),
  credit_card_name: z.string().optional(),
  credit_card_last_four: z.string().max(4, "4 chiffres maximum").optional(),
  backup_email: z.string().email("Email invalide").optional().or(z.literal("")),
  status: z.enum(['Actif', 'Suspendu']),
  spf_dkim_status: z.enum(['Oui', 'Non', 'En cours']),
  dedicated_ip: z.boolean(),
  dedicated_ip_address: z.string().optional(),
  routing_interfaces: z.array(z.string()).min(1, "Sélectionnez au moins une interface"),
  front_office_ids: z.array(z.string()).optional(),
  // Nouveaux champs pour le domaine
  domain_name: z.string().optional(),
  domain_hosting_provider: z.enum(['OVH', 'Gandhi', 'Ionos']).optional(),
  domain_login: z.string().optional(),
  domain_password: z.string().optional(),
}).refine((data) => {
  if (data.dedicated_ip && !data.dedicated_ip_address) {
    return false;
  }
  return true;
}, {
  message: "L'adresse IP est requise si IP dédiée est activée",
  path: ["dedicated_ip_address"]
});

type FormData = z.infer<typeof formSchema>;

interface EmailPlatformAccountFormProps {
  account?: EmailPlatformAccount;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmailPlatformAccountForm = ({
  account,
  onSubmit,
  onCancel,
  isLoading = false
}: EmailPlatformAccountFormProps) => {
  const { data: platforms } = useEmailPlatforms();
  const { data: frontOffices } = useFrontOffices();
  const { data: missions } = useMissionsQuery();

  // Helper function to safely convert dedicated_ip_address to string
  const getDedicatedIpAddressString = (address: unknown): string => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object' && 'toString' in address) {
      return address.toString();
    }
    return String(address || '');
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_id: account?.mission_id || "",
      platform_id: account?.platform_id || "",
      login: account?.login || "",
      password: "", // Toujours vide pour la sécurité
      phone_number: account?.phone_number || "",
      credit_card_name: account?.credit_card_name || "",
      credit_card_last_four: account?.credit_card_last_four || "",
      backup_email: account?.backup_email || "",
      status: (account?.status as 'Actif' | 'Suspendu') || 'Actif',
      spf_dkim_status: (account?.spf_dkim_status as 'Oui' | 'Non' | 'En cours') || 'Non',
      dedicated_ip: account?.dedicated_ip || false,
      dedicated_ip_address: getDedicatedIpAddressString(account?.dedicated_ip_address),
      routing_interfaces: account?.routing_interfaces || [],
      front_office_ids: account?.front_offices?.map(fo => fo.id) || [],
      // Valeurs par défaut pour les nouveaux champs domaine
      domain_name: (account as any)?.domain_name || "",
      domain_hosting_provider: (account as any)?.domain_hosting_provider || undefined,
      domain_login: (account as any)?.domain_login || "",
      domain_password: (account as any)?.domain_password || "",
    },
  });

  const watchDedicatedIp = form.watch("dedicated_ip");
  const watchRoutingInterfaces = form.watch("routing_interfaces");
  const showFrontOffices = watchRoutingInterfaces.includes("SMTP") || watchRoutingInterfaces.includes("Les deux");

  const handleSubmit = (data: FormData) => {
    console.log("Form data before submission:", data);
    
    // Validation supplémentaire
    if (data.dedicated_ip && !data.dedicated_ip_address?.trim()) {
      form.setError("dedicated_ip_address", {
        type: "manual",
        message: "L'adresse IP est requise si IP dédiée est activée"
      });
      return;
    }

    // Nettoyer les données avant envoi
    const cleanedData = {
      ...data,
      phone_number: data.phone_number?.trim() || undefined,
      credit_card_name: data.credit_card_name?.trim() || undefined,
      credit_card_last_four: data.credit_card_last_four?.trim() || undefined,
      backup_email: data.backup_email?.trim() || undefined,
      dedicated_ip_address: data.dedicated_ip_address?.trim() || undefined,
      domain_name: data.domain_name?.trim() || undefined,
      domain_login: data.domain_login?.trim() || undefined,
      domain_password: data.domain_password?.trim() || undefined,
    };

    console.log("Cleaned form data:", cleanedData);
    onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Plateforme */}
          <FormField
            control={form.control}
            name="platform_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plateforme d'emailing *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une plateforme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {platforms?.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Identifiants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Login *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Identifiant de connexion" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder={account ? "Laisser vide pour conserver" : "Mot de passe"} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informations sensibles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de téléphone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="06 12 34 56 78" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credit_card_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom sur la carte</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nom du porteur" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credit_card_last_four"
            render={({ field }) => (
              <FormItem>
                <FormLabel>4 derniers chiffres</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="1234" maxLength={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="backup_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de secours</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@exemple.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Statuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut du compte</FormLabel>
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

          <FormField
            control={form.control}
            name="spf_dkim_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SPF/DKIM</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Oui">Oui</SelectItem>
                    <SelectItem value="Non">Non</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* IP dédiée */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="dedicated_ip"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>IP dédiée</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {watchDedicatedIp && (
            <FormField
              control={form.control}
              name="dedicated_ip_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse IP *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="192.168.1.1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Interfaces de routage */}
        <FormField
          control={form.control}
          name="routing_interfaces"
          render={() => (
            <FormItem>
              <FormLabel>Interfaces de routage *</FormLabel>
              <div className="flex flex-wrap gap-4">
                {ROUTING_INTERFACES.map((interface_name) => (
                  <FormField
                    key={interface_name}
                    control={form.control}
                    name="routing_interfaces"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={interface_name}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(interface_name)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, interface_name])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== interface_name
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {interface_name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Front offices (si SMTP sélectionné) */}
        {showFrontOffices && (
          <FormField
            control={form.control}
            name="front_office_ids"
            render={() => (
              <FormItem>
                <FormLabel>Front offices d'emailing</FormLabel>
                <div className="flex flex-wrap gap-4">
                  {frontOffices?.map((frontOffice) => (
                    <FormField
                      key={frontOffice.id}
                      control={form.control}
                      name="front_office_ids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={frontOffice.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(frontOffice.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), frontOffice.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== frontOffice.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {frontOffice.name}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Nouvelle section Nom de domaine */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Nom de domaine</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="domain_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de domaine</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="exemple.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain_hosting_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hébergeur</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un hébergeur" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="domain_login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Login hébergeur" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Mot de passe en clair" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : account ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
