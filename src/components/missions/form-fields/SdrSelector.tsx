
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { getAllUsers } from "@/services/user/userQueries";
import { MissionFormValues } from "@/types/types";
import { useState, useEffect } from "react";

interface SdrSelectorProps {
  control: Control<MissionFormValues>;
  disabled?: boolean;
  initialSdrName?: string;
}

export function SdrSelector({ control, disabled = false, initialSdrName }: SdrSelectorProps) {
  const [sdrsLoaded, setSdrsLoaded] = useState(false);
  
  // Fetch SDRs for assignment - fixed to use proper options structure
  const { data: users = [], isLoading: isSdrsLoading } = useQuery({
    queryKey: ['users-for-mission-edit'],
    queryFn: getAllUsers,
    staleTime: 60000, // Cache data for 1 minute
  });

  // Set the loaded state after data is fetched
  useEffect(() => {
    if (users.length > 0 || !isSdrsLoading) {
      setSdrsLoaded(true);
    }
  }, [users, isSdrsLoading]);
  
  const sdrs = users.filter(user => user.role === 'sdr');
  
  // Logs for debugging
  useEffect(() => {
    if (sdrs.length > 0) {
      console.log("SDRs chargés:", sdrs);
    }
    
    if (initialSdrName) {
      console.log("SDR initial:", initialSdrName);
    }
  }, [sdrs, initialSdrName]);

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
                <SelectValue placeholder={initialSdrName || "Sélectionner un SDR"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isSdrsLoading ? (
                <SelectItem value="loading" disabled>
                  Chargement des SDRs...
                </SelectItem>
              ) : sdrs.length > 0 ? (
                sdrs.map((sdr) => (
                  <SelectItem key={sdr.id} value={sdr.id}>
                    {sdr.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-sdrs" disabled>
                  Aucun SDR disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
