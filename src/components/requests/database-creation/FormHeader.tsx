
import { Control } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { User } from "@/types/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getMissionsByUserId } from "@/services/missionService";
import { useState, useEffect } from "react";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  // Récupérer les missions de l'utilisateur connecté
  const { data: userMissions = [] } = useQuery({
    queryKey: ['missions', user?.id],
    queryFn: () => user?.id ? getMissionsByUserId(user.id) : [],
    enabled: !!user?.id,
  });

  // Pour le débogage - vérifier les valeurs au chargement du composant
  useEffect(() => {
    try {
      // @ts-ignore - Accès aux valeurs actuelles du formulaire pour le débogage
      const currentValues = control._formValues;
      if (currentValues) {
        console.log("DatabaseFormHeader - Valeurs actuelles du formulaire:", currentValues);
        console.log("DatabaseFormHeader - Mission ID dans les valeurs du form:", currentValues.missionId);
        console.log("DatabaseFormHeader - Type de la mission ID:", typeof currentValues.missionId);
      }
    } catch (err) {
      console.log("Impossible d'accéder aux valeurs du formulaire pour le débogage");
    }
  }, [control]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre de la demande</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Base leads IT Janvier 2025" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="missionId"
        render={({ field }) => {
          // Logs pour déboguer
          console.log("DatabaseFormHeader - Valeur brute du champ mission:", field.value);
          console.log("DatabaseFormHeader - Type de la valeur:", typeof field.value);
          
          // S'assurer que la valeur est une chaîne de caractères
          const missionValue = field.value ? String(field.value) : "";
          console.log("DatabaseFormHeader - Valeur après conversion:", missionValue);
          console.log("DatabaseFormHeader - Missions disponibles:", userMissions);
          
          return (
            <FormItem>
              <FormLabel>Mission client</FormLabel>
              <FormControl>
                <Select 
                  value={missionValue}
                  onValueChange={(value) => {
                    console.log("DatabaseFormHeader - Nouvelle valeur sélectionnée:", value);
                    field.onChange(value);
                  }}
                  disabled={field.disabled || editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une mission" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {userMissions.length > 0 ? (
                      userMissions.map((mission) => (
                        <SelectItem key={mission.id} value={String(mission.id)}>
                          {mission.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-missions" disabled>
                        Aucune mission disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date de livraison souhaitée</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "d MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Sélectionnez une date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="tool"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Outil</FormLabel>
            <FormControl>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={field.disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un outil" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Hubspot">Hubspot</SelectItem>
                  <SelectItem value="Apollo">Apollo</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
