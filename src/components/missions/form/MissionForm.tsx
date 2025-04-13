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
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface MissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (values: MissionFormValues) => void;
  onCancel: () => void;
}

export function MissionForm({ mission, isSubmitting, onSubmit, onCancel }: MissionFormProps) {
  const [formInitialized, setFormInitialized] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full",
      status: "En cours",
    },
  });

  useEffect(() => {
    if (mission) {
      console.log("Initialisation du formulaire d'édition avec les valeurs de mission:", mission);
      try {
        form.reset({
          name: mission.name,
          sdrId: mission.sdrId || "",
          description: mission.description || "",
          startDate: mission.startDate ? new Date(mission.startDate) : null,
          endDate: mission.endDate ? new Date(mission.endDate) : null,
          type: mission.type,
          status: mission.status,
        });
        setFormInitialized(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du formulaire:", error);
      }
    }
  }, [mission, form]);

  const startDate = form.watch("startDate");

  if (!formInitialized && mission) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Chargement du formulaire...</span>
      </div>
    );
  }

  if (!isAdmin && mission) {
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

          <FormItem>
            <FormLabel>
              Assigner à (SDR) <span className="text-red-500">*</span>
            </FormLabel>
            <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700">
              {mission.sdrName || "Non assigné"}
            </div>
            <input type="hidden" {...form.register("sdrId")} />
          </FormItem>

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

          <FormItem>
            <FormLabel>Statut de la mission</FormLabel>
            <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700">
              {mission.status}
            </div>
            <input type="hidden" {...form.register("status")} />
          </FormItem>

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

        <SdrSelector 
          control={form.control} 
          disabled={isSubmitting} 
          initialSdrName={mission?.sdrName}
        />

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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut de la mission</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </FormItem>
          )}
        />

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
