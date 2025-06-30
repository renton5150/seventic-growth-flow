
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
import { getAllSupaMissions } from "@/services/missions/getMissions";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  // Récupérer toutes les missions si admin, sinon seulement celles de l'utilisateur
  const isAdmin = user?.role === 'admin';
  
  const { data: userMissions = [] } = useQuery({
    queryKey: ['missions', user?.id],
    queryFn: () => user?.id ? getMissionsByUserId(user.id) : [],
    enabled: !!user?.id && !isAdmin,
  });

  const { data: allMissions = [] } = useQuery({
    queryKey: ['missions', 'all'],
    queryFn: () => getAllSupaMissions(),
    enabled: isAdmin,
  });

  const missions = isAdmin ? allMissions : userMissions;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre de la demande</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Scrapping LinkedIn CTOs France" {...field} />
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
                disabled={field.disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une mission" />
                </SelectTrigger>
                <SelectContent>
                  {missions.length > 0 ? (
                    missions.map((mission) => (
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
            <FormLabel>Date et heure de livraison souhaitée</FormLabel>
            <div className="space-y-2">
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
                        format(new Date(field.value), "d MMMM yyyy", { locale: fr })
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
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Conserver l'heure existante ou définir 09:00 par défaut
                        const currentDateTime = field.value ? new Date(field.value) : new Date();
                        if (!field.value) {
                          currentDateTime.setHours(9, 0, 0, 0);
                        }
                        date.setHours(currentDateTime.getHours(), currentDateTime.getMinutes(), 0, 0);
                        field.onChange(date.toISOString());
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="time"
                    value={field.value ? format(new Date(field.value), "HH:mm") : "09:00"}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const currentDate = field.value ? new Date(field.value) : new Date();
                      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      field.onChange(currentDate.toISOString());
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
