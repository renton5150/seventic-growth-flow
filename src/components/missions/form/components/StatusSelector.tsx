
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { MissionFormValues } from "@/types/types";
import { CheckCircle2, Clock } from "lucide-react";

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
              <SelectTrigger className="flex items-center">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="En cours" className="flex items-center">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-blue-500" />
                  <span>En cours</span>
                </div>
              </SelectItem>
              <SelectItem value="Terminé" className="flex items-center">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Terminé</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
