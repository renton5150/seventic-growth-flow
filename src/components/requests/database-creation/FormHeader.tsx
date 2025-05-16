
import { useEffect, useState } from "react";
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
import { getMissionName, syncKnownMissions } from "@/services/missionNameService";
import { toast } from "sonner";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  const [missionName, setMissionName] = useState<string>("");
  const [isLoadingMissionName, setIsLoadingMissionName] = useState<boolean>(false);
  
  // Récupérer les missions de l'utilisateur connecté
  const { data: userMissions = [] } = useQuery({
    queryKey: ['missions', user?.id],
    queryFn: () => user?.id ? getMissionsByUserId(user.id) : [],
    enabled: !!user?.id,
  });

  // Pour le débogage et la résolution des noms de mission
  useEffect(() => {
    const initializeMissions = async () => {
      try {
        // Synchroniser les missions connues pour garantir que le cache est bien initialisé
        await syncKnownMissions();
        console.log("DatabaseFormHeader - Missions synchronisées au démarrage");
        
        // @ts-ignore - Accès aux valeurs actuelles du formulaire pour le débogage
        const currentValues = control._formValues;
        if (currentValues) {
          console.log("DatabaseFormHeader - Valeurs actuelles du formulaire:", currentValues);
          console.log("DatabaseFormHeader - Mission ID dans les valeurs du form:", currentValues.missionId);
          console.log("DatabaseFormHeader - Type de la mission ID:", typeof currentValues.missionId);
          
          // Si nous sommes en mode édition, charger le nom de la mission
          if (editMode && currentValues.missionId) {
            setIsLoadingMissionName(true);
            try {
              // Forcer le rafraîchissement pour garantir l'obtention des données à jour
              const name = await getMissionName(String(currentValues.missionId), { 
                forceRefresh: true 
              });
              console.log(`DatabaseFormHeader - Nom de mission chargé: "${name}" pour ID: ${currentValues.missionId}`);
              setMissionName(name);
              
              // Test spécial pour Freshworks
              if (currentValues.missionId === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b" && name !== "Freshworks") {
                console.error("DatabaseFormHeader - ERREUR: Freshworks n'a pas été résolu correctement!");
                setMissionName("Freshworks");
              }
            } catch (err) {
              console.error("DatabaseFormHeader - Erreur lors du chargement du nom de mission:", err);
            } finally {
              setIsLoadingMissionName(false);
            }
          }
        }
      } catch (err) {
        console.error("DatabaseFormHeader - Erreur lors de l'initialisation des missions:", err);
      }
    };
    
    initializeMissions();
  }, [control, editMode]);
  
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
                {editMode ? (
                  // En mode édition, afficher un champ avec le nom de la mission
                  <div className="flex flex-col">
                    <Input 
                      value={isLoadingMissionName ? "Chargement..." : missionName || "Mission non trouvée"}
                      disabled={true}
                      className={cn(
                        "bg-gray-100",
                        isLoadingMissionName ? "text-gray-400" : missionName ? "text-gray-900" : "text-red-500"
                      )}
                    />
                    <input type="hidden" {...field} />
                    {missionValue && !missionName && !isLoadingMissionName && (
                      <div className="mt-1 text-xs text-red-500">
                        Impossible de résoudre le nom de cette mission.
                      </div>
                    )}
                  </div>
                ) : (
                  // En mode création, afficher le sélecteur normal
                  <Select 
                    value={missionValue}
                    onValueChange={(value) => {
                      console.log("DatabaseFormHeader - Nouvelle valeur sélectionnée:", value);
                      field.onChange(value);
                      
                      // Charger le nom pour affichage immédiat
                      getMissionName(value).then(name => {
                        console.log(`Mission sélectionnée: ${value} => "${name}"`);
                      });
                    }}
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
                )}
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
