
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
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mission client</FormLabel>
            <FormControl>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={field.disabled || editMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une mission" />
                </SelectTrigger>
                <SelectContent>
                  {userMissions.length > 0 ? (
                    userMissions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
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
        )}
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
                <SelectContent>
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
