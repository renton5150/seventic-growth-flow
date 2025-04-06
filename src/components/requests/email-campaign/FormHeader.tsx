
import { Control } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { User } from "@/types/types";
import { useState, useEffect } from "react";
import { Mission } from "@/types/types";
import { getMissionsByUserId } from "@/services/missionService";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
}

export const FormHeader = ({ control, user }: FormHeaderProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMissions = async () => {
      if (user) {
        try {
          console.log("Chargement des missions pour l'utilisateur:", user.id);
          const userMissions = await getMissionsByUserId(user.id);
          console.log("Missions récupérées:", userMissions);
          setMissions(userMissions);
        } catch (error) {
          console.error("Erreur lors du chargement des missions:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchMissions();
  }, [user]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre de la campagne</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Newsletter Mars 2025" {...field} />
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
              <select
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                {...field}
                disabled={loading}
              >
                <option value="" disabled>
                  {loading ? "Chargement des missions..." : "Sélectionnez une mission"}
                </option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.name}
                  </option>
                ))}
              </select>
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
            <FormLabel>Date d'envoi souhaitée</FormLabel>
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
    </div>
  );
};
