
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { MissionFormValues } from "@/types/types";

interface BasicMissionFieldsProps {
  control: Control<any>; // Utiliser any pour éviter les erreurs de typage restrictives
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
            <FormLabel>
              Nom de la mission <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nom de la mission" disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optionnelle)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Description de la mission"
                className="resize-none"
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
