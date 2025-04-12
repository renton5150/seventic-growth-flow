
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Mission } from "@/types/types";
import { MissionFormValues, missionFormSchema } from "../schemas/missionFormSchema";
import { DateField } from "../form-fields/DateField";
import { SdrSelector } from "../form-fields/SdrSelector";
import { MissionTypeSelector } from "../form-fields/MissionTypeSelector";

interface MissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (values: MissionFormValues) => void;
  onCancel: () => void;
}

export function MissionForm({ mission, isSubmitting, onSubmit, onCancel }: MissionFormProps) {
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full",
    },
  });

  // Mettre à jour les valeurs du formulaire quand la mission change
  useEffect(() => {
    if (mission) {
      console.log("Initialisation du formulaire d'édition avec les valeurs de mission:", mission);
      form.reset({
        name: mission.name,
        sdrId: mission.sdrId,
        description: mission.description || "",
        startDate: mission.startDate ? new Date(mission.startDate) : null,
        endDate: mission.endDate ? new Date(mission.endDate) : null,
        type: mission.type,
      });
    }
  }, [mission, form]);

  const startDate = form.watch("startDate");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nom de la mission <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nom de la mission" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SdrSelector control={form.control} disabled={isSubmitting} />

        <DateField 
          control={form.control}
          name="startDate"
          label="Date de démarrage"
          disabled={isSubmitting}
        />

        <DateField 
          control={form.control}
          name="endDate"
          label="Date de fin"
          disabled={isSubmitting}
          minDate={startDate}
        />

        <MissionTypeSelector control={form.control} disabled={isSubmitting} />

        <FormField
          control={form.control}
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
