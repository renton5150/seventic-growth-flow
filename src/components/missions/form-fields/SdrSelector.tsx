
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { getAllUsers } from "@/services/user/userQueries";
import { MissionFormValues } from "../schemas/missionFormSchema";

interface SdrSelectorProps {
  control: Control<MissionFormValues>;
  disabled?: boolean;
}

export function SdrSelector({ control, disabled = false }: SdrSelectorProps) {
  // Fetch SDRs for assignment
  const { data: users = [], isLoading: isSdrsLoading } = useQuery({
    queryKey: ['users-for-mission-edit'],
    queryFn: getAllUsers,
  });

  const sdrs = users.filter(user => user.role === 'sdr');

  return (
    <FormField
      control={control}
      name="sdrId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Assigner à (SDR) <span className="text-red-500">*</span>
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
            disabled={disabled || isSdrsLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un SDR" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isSdrsLoading ? (
                <SelectItem value="loading" disabled>
                  Chargement des SDRs...
                </SelectItem>
              ) : (
                sdrs.map((sdr) => (
                  <SelectItem key={sdr.id} value={sdr.id}>
                    {sdr.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
