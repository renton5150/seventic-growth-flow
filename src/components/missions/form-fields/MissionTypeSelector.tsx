
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { MissionFormValues } from "../schemas/missionFormSchema";
import { useAuth } from "@/contexts/auth";

interface MissionTypeSelectorProps {
  control: Control<MissionFormValues>;
  disabled?: boolean;
}

export function MissionTypeSelector({ control, disabled = false }: MissionTypeSelectorProps) {
  const { isAdmin } = useAuth();
  
  // Les admins, SDR et growth peuvent tous modifier le type de mission
  // Seuls les autres rôles ne peuvent pas
  const canEditType = isAdmin || disabled === false;
  
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Type de mission <span className="text-red-500">*</span>
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Part">Part</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
