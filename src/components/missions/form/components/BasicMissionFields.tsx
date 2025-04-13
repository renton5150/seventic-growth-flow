
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { MissionFormValues } from "@/types/types";
import { Briefcase, FileText } from "lucide-react";

interface BasicMissionFieldsProps {
  control: Control<any>;
  isSubmitting: boolean;
}

export function BasicMissionFields({ control, isSubmitting }: BasicMissionFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Nom de la mission <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Ex: Campagne LinkedIn pour ClientX" 
                disabled={isSubmitting} 
                className="transition-all focus:scale-[1.01]"
              />
            </FormControl>
            <FormDescription>
              Donnez un nom clair et descriptif à votre mission
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Description (optionnelle)
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Décrivez les objectifs et contexte de la mission..."
                className="resize-none min-h-[120px] transition-all focus:scale-[1.01]"
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              Fournissez des détails supplémentaires pour aider les SDRs à comprendre la mission
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
