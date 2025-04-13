
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { MissionFormValues } from "../schemas/missionFormSchema";

interface StatusSelectorProps {
  control: Control<MissionFormValues>;
  disabled?: boolean;
}

export function StatusSelector({ control, disabled = false }: StatusSelectorProps) {
  return (
    <FormField
      control={control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Statut de la mission</FormLabel>
          <Select 
            onValueChange={(value) => {
              console.log("Changement de statut à:", value);
              field.onChange(value);
            }}
            defaultValue={field.value}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
