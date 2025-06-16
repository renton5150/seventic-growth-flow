
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { EmailPlatformAccount, EmailPlatformAccountFormData, ROUTING_INTERFACES } from "@/types/emailPlatforms.types";
import { useEmailPlatforms, useFrontOffices } from "@/hooks/emailPlatforms/useEmailPlatforms";
import { useMissions } from "@/hooks/useMissions";
import { getDecryptedPassword } from "@/services/emailPlatforms/emailPlatformService";

const formSchema = z.object({
  mission_id: z.string().min(1, "La mission est requise"),
  platform_id: z.string().min(1, "La plateforme est requise"),
  platform_name: z.string().optional(),
  login: z.string().min(1, "Le login est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  phone_number: z.string().optional(),
  credit_card_name: z.string().optional(),
  credit_card_last_four: z.string().optional(),
  backup_email: z.string().email("Email invalide").optional().or(z.literal("")),
  status: z.enum(['Actif', 'Suspendu']),
  spf_dkim_status: z.enum(['Oui', 'Non', 'En cours']),
  dedicated_ip: z.boolean(),
  dedicated_ip_address: z.string().optional(),
  routing_interfaces: z.array(z.string()).min(1, "Au moins une interface est requise"),
  front_office_ids: z.array(z.string()).optional(),
  domain_name: z.string().optional(),
  domain_hosting_provider: z.enum(['OVH', 'Gandhi', 'Ionos']).optional(),
  domain_login: z.string().optional(),
  domain_password: z.string().optional(),
});

interface EmailPlatformAccountFormProps {
  account?: EmailPlatformAccount;
  onSubmit: (data: EmailPlatformAccountFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmailPlatformAccountForm = ({
  account,
  onSubmit,
  onCancel,
  isLoading = false
}: EmailPlatformAccountFormProps) => {
  const { data: missions } = useMissions();
  const { data: platforms } = useEmailPlatforms();
  const { data: frontOffices } = useFrontOffices();
  const [showPassword, setShowPassword] = useState(false);
  const [showDomainPassword, setShowDomainPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EmailPlatformAccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: account ? {
      mission_id: account.mission_id,
      platform_id: account.platform_id,
      login: account.login,
      password: getDecryptedPassword(account.password_encrypted),
      phone_number: account.phone_number || "",
      credit_card_name: account.credit_card_name || "",
      credit_card_last_four: account.credit_card_last_four || "",
      backup_email: account.backup_email || "",
      status: account.status as 'Actif' | 'Suspendu',
      spf_dkim_status: account.spf_dkim_status as 'Oui' | 'Non' | 'En cours',
      dedicated_ip: account.dedicated_ip,
      dedicated_ip_address: account.dedicated_ip_address ? String(account.dedicated_ip_address) : "",
      routing_interfaces: account.routing_interfaces || [],
      front_office_ids: account.front_offices?.map(fo => fo.id) || [],
      domain_name: account.domain_name || "",
      domain_hosting_provider: account.domain_hosting_provider as 'OVH' | 'Gandhi' | 'Ionos' || undefined,
      domain_login: account.domain_login || "",
      domain_password: account.domain_password || "",
    } : {
      status: 'Actif',
      spf_dkim_status: 'Non',
      dedicated_ip: false,
      routing_interfaces: [],
      front_office_ids: [],
    }
  });

  const watchedPlatform = watch("platform_id");
  const watchedDedicatedIp = watch("dedicated_ip");
  const watchedPassword = watch("password");
  const watchedDomainPassword = watch("domain_password");

  const handleFormSubmit = (data: EmailPlatformAccountFormData) => {
    onSubmit(data);
  };

  const handleRoutingInterfaceChange = (interfaceName: string, checked: boolean) => {
    const currentInterfaces = watch("routing_interfaces") || [];
    if (checked) {
      setValue("routing_interfaces", [...currentInterfaces, interfaceName]);
    } else {
      setValue("routing_interfaces", currentInterfaces.filter(i => i !== interfaceName));
    }
  };

  const handleFrontOfficeChange = (frontOfficeId: string, checked: boolean) => {
    const currentFrontOffices = watch("front_office_ids") || [];
    if (checked) {
      setValue("front_office_ids", [...currentFrontOffices, frontOfficeId]);
    } else {
      setValue("front_office_ids", currentFrontOffices.filter(id => id !== frontOfficeId));
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mission_id">Mission *</Label>
            <Controller
              name="mission_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions?.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} - {mission.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.mission_id && (
              <p className="text-sm text-red-500 mt-1">{errors.mission_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="platform_id">Plateforme *</Label>
            <Controller
              name="platform_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms?.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="manual">Autre (saisie manuelle)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.platform_id && (
              <p className="text-sm text-red-500 mt-1">{errors.platform_id.message}</p>
            )}
          </div>

          {watchedPlatform === "manual" && (
            <div>
              <Label htmlFor="platform_name">Nom de la nouvelle plateforme *</Label>
              <Input
                id="platform_name"
                {...register("platform_name")}
                placeholder="Nom de la plateforme"
              />
              {errors.platform_name && (
                <p className="text-sm text-red-500 mt-1">{errors.platform_name.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="login">Login *</Label>
            <Input
              id="login"
              {...register("login")}
              placeholder="Login du compte"
            />
            {errors.login && (
              <p className="text-sm text-red-500 mt-1">{errors.login.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                value={watchedPassword || ""}
                placeholder="Mot de passe du compte"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Informations supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone_number">Numéro de téléphone</Label>
            <Input
              id="phone_number"
              {...register("phone_number")}
              placeholder="Numéro de téléphone"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credit_card_name">Nom sur la carte bancaire</Label>
              <Input
                id="credit_card_name"
                {...register("credit_card_name")}
                placeholder="Nom sur la carte"
              />
            </div>
            <div>
              <Label htmlFor="credit_card_last_four">4 derniers chiffres</Label>
              <Input
                id="credit_card_last_four"
                {...register("credit_card_last_four")}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="backup_email">Email de secours</Label>
            <Input
              id="backup_email"
              type="email"
              {...register("backup_email")}
              placeholder="email@exemple.com"
            />
            {errors.backup_email && (
              <p className="text-sm text-red-500 mt-1">{errors.backup_email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration technique */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration technique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Statut *</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="spf_dkim_status">SPF/DKIM *</Label>
              <Controller
                name="spf_dkim_status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.spf_dkim_status && (
                <p className="text-sm text-red-500 mt-1">{errors.spf_dkim_status.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="dedicated_ip"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="dedicated_ip">IP dédiée</Label>
            </div>

            {watchedDedicatedIp && (
              <div>
                <Label htmlFor="dedicated_ip_address">Adresse IP dédiée</Label>
                <Input
                  id="dedicated_ip_address"
                  {...register("dedicated_ip_address")}
                  placeholder="192.168.1.1"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Interfaces de routage *</Label>
            <div className="space-y-2 mt-2">
              {ROUTING_INTERFACES.map((interface_name) => (
                <div key={interface_name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interface-${interface_name}`}
                    checked={watch("routing_interfaces")?.includes(interface_name) || false}
                    onCheckedChange={(checked) => 
                      handleRoutingInterfaceChange(interface_name, checked as boolean)
                    }
                  />
                  <Label htmlFor={`interface-${interface_name}`}>{interface_name}</Label>
                </div>
              ))}
            </div>
            {errors.routing_interfaces && (
              <p className="text-sm text-red-500 mt-1">{errors.routing_interfaces.message}</p>
            )}
          </div>

          {frontOffices && frontOffices.length > 0 && (
            <div>
              <Label>Front offices</Label>
              <div className="space-y-2 mt-2">
                {frontOffices.map((frontOffice) => (
                  <div key={frontOffice.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`frontoffice-${frontOffice.id}`}
                      checked={watch("front_office_ids")?.includes(frontOffice.id) || false}
                      onCheckedChange={(checked) => 
                        handleFrontOfficeChange(frontOffice.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`frontoffice-${frontOffice.id}`}>{frontOffice.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations domaine */}
      <Card>
        <CardHeader>
          <CardTitle>Informations domaine (optionnel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="domain_name">Nom de domaine</Label>
            <Input
              id="domain_name"
              {...register("domain_name")}
              placeholder="exemple.com"
            />
          </div>

          <div>
            <Label htmlFor="domain_hosting_provider">Hébergeur du domaine</Label>
            <Controller
              name="domain_hosting_provider"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un hébergeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    <SelectItem value="OVH">OVH</SelectItem>
                    <SelectItem value="Gandhi">Gandhi</SelectItem>
                    <SelectItem value="Ionos">Ionos</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="domain_login">Login du domaine</Label>
            <Input
              id="domain_login"
              {...register("domain_login")}
              placeholder="Login du compte de domaine"
            />
          </div>

          <div>
            <Label htmlFor="domain_password">Mot de passe du domaine</Label>
            <div className="relative">
              <Input
                id="domain_password"
                type={showDomainPassword ? "text" : "password"}
                {...register("domain_password")}
                value={watchedDomainPassword || ""}
                placeholder="Mot de passe du compte de domaine"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowDomainPassword(!showDomainPassword)}
              >
                {showDomainPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Enregistrement..." : account ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
};
