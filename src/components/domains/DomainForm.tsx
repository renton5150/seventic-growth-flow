
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Domain, DomainFormData } from "@/types/domains.types";
import { getDecryptedDomainPassword } from "@/services/domains/domainService";
import { useMissions } from "@/hooks/useMissions";

const domainFormSchema = z.object({
  domain_name: z.string().min(1, "Le nom de domaine est requis"),
  mission_id: z.string().optional(),
  hosting_provider: z.enum(['OVH', 'Gandhi', 'Ionos']),
  login: z.string().min(1, "Le login est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  creation_date: z.string().min(1, "La date de création est requise"),
  expiration_date: z.string().min(1, "La date d'expiration est requise"),
  status: z.enum(['Actif', 'Suspendu']),
});

interface DomainFormProps {
  domain?: Domain;
  onSubmit: (data: DomainFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DomainForm = ({
  domain,
  onSubmit,
  onCancel,
  isLoading = false
}: DomainFormProps) => {
  const { data: missions } = useMissions();
  const [showPassword, setShowPassword] = useState(false);
  const [creationDateOpen, setCreationDateOpen] = useState(false);
  const [expirationDateOpen, setExpirationDateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: domain ? {
      domain_name: domain.domain_name,
      mission_id: domain.mission_id || undefined,
      hosting_provider: domain.hosting_provider,
      login: domain.login,
      password: getDecryptedDomainPassword(domain.password_encrypted),
      creation_date: domain.creation_date,
      expiration_date: domain.expiration_date,
      status: domain.status,
    } : {
      status: 'Actif',
      hosting_provider: 'OVH',
      mission_id: undefined,
    }
  });

  const watchedCreationDate = watch("creation_date");
  const watchedExpirationDate = watch("expiration_date");
  const watchedPassword = watch("password");

  const handleFormSubmit = (data: DomainFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du domaine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="domain_name">Nom de domaine *</Label>
            <Input
              id="domain_name"
              {...register("domain_name")}
              placeholder="exemple.com"
            />
            {errors.domain_name && (
              <p className="text-sm text-red-500 mt-1">{errors.domain_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mission_id">Mission (optionnel)</Label>
            <Select
              value={watch("mission_id") || undefined}
              onValueChange={(value) => setValue("mission_id", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une mission (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {missions?.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.name} - {mission.client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hosting_provider">Hébergeur *</Label>
            <Select
              value={watch("hosting_provider")}
              onValueChange={(value) => setValue("hosting_provider", value as 'OVH' | 'Gandhi' | 'Ionos')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OVH">OVH</SelectItem>
                <SelectItem value="Gandhi">Gandhi</SelectItem>
                <SelectItem value="Ionos">Ionos</SelectItem>
              </SelectContent>
            </Select>
            {errors.hosting_provider && (
              <p className="text-sm text-red-500 mt-1">{errors.hosting_provider.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="login">Login *</Label>
            <Input
              id="login"
              {...register("login")}
              placeholder="Login du compte hébergeur"
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
                placeholder="Mot de passe du compte hébergeur"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de création *</Label>
              <Popover open={creationDateOpen} onOpenChange={setCreationDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedCreationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedCreationDate ? (
                      format(new Date(watchedCreationDate), "d MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedCreationDate ? new Date(watchedCreationDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue("creation_date", format(date, "yyyy-MM-dd"));
                        setCreationDateOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.creation_date && (
                <p className="text-sm text-red-500 mt-1">{errors.creation_date.message}</p>
              )}
            </div>

            <div>
              <Label>Date d'expiration *</Label>
              <Popover open={expirationDateOpen} onOpenChange={setExpirationDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedExpirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedExpirationDate ? (
                      format(new Date(watchedExpirationDate), "d MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedExpirationDate ? new Date(watchedExpirationDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue("expiration_date", format(date, "yyyy-MM-dd"));
                        setExpirationDateOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.expiration_date && (
                <p className="text-sm text-red-500 mt-1">{errors.expiration_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Statut *</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as 'Actif' | 'Suspendu')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
            )}
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
          {isLoading ? "Enregistrement..." : domain ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
};
