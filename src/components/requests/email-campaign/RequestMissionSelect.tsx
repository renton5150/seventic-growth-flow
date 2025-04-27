
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getMissions } from "@/services/missions";

interface RequestMissionSelectProps {
  control: any;
  disabled?: boolean;
}

export const RequestMissionSelect: React.FC<RequestMissionSelectProps> = ({ control, disabled = false }) => {
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: getMissions,
  });

  return (
    <FormField
      control={control}
      name="missionId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Mission</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value} 
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une mission" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {missions.map((mission) => (
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
  );
};
