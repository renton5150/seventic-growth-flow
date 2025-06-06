
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { MissionFormValues } from "../schemas/missionFormSchema";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import { useAuth } from "@/contexts/auth";

interface SdrSelectorProps {
  control: Control<MissionFormValues>;
  disabled?: boolean;
  initialSdrName?: string;
}

export function SdrSelector({ control, disabled = false, initialSdrName }: SdrSelectorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  
  // Admin et Growth peuvent voir et changer tous les SDRs
  const canChangeAssignment = isAdmin || isGrowth;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-for-missions'],
    queryFn: getAllUsers,
  });

  // Filtrer pour ne montrer que les utilisateurs avec le rôle 'sdr' et 'growth'
  const sdrAndGrowthUsers = users.filter(user => user.role === 'sdr' || user.role === 'growth');

  if (isLoading) {
    return (
      <FormField
        control={control}
        name="sdrId"
        render={() => (
          <FormItem>
            <FormLabel>
              Assigné à <span className="text-red-500">*</span>
            </FormLabel>
            <Select disabled>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Chargement..." />
                </SelectTrigger>
              </FormControl>
            </Select>
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={control}
      name="sdrId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Assigné à <span className="text-red-500">*</span>
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
            disabled={disabled || (!canChangeAssignment && !!initialSdrName)}
          >
            <FormControl>
              <SelectTrigger className={(!canChangeAssignment && !!initialSdrName) ? "bg-gray-100" : ""}>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="unassigned">Non assigné</SelectItem>
              {sdrAndGrowthUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email} ({user.role?.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
