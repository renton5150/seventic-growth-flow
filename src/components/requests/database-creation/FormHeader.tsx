
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
import { getMissionName, syncKnownMissions, forceRefreshFreshworks } from "@/services/missionNameService";
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

  // Synchroniser le cache de missions en premier
  useEffect(() => {
    const initializeData = async () => {
      console.log("FormHeader - Initialisation du cache de missions et Freshworks");
      // Forcer Freshworks en cache dès le démarrage
      forceRefreshFreshworks();
      // Synchroniser toutes les missions connues
      await syncKnownMissions();
      
      loadCurrentMissionName();
    };
    
    initializeData();
  }, []);
  
  // Chargement du nom de la mission actuelle quand le formulaire est initialisé
  const loadCurrentMissionName = async () => {
    try {
      // @ts-ignore - Accès aux valeurs actuelles du formulaire
      const currentValues = control._formValues;
      
      if (currentValues && currentValues.missionId) {
        const missionId = String(currentValues.missionId);
        console.log(`FormHeader - Chargement du nom pour la mission: ${missionId}`);
        
        setIsLoadingMissionName(true);
        
        // Vérification spéciale pour Freshworks
        if (missionId === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b") {
          console.log("FormHeader - ID Freshworks détecté, force nom");
          setMissionName("Freshworks");
        } else {
          try {
            // Forcer le rafraîchissement pour garantir l'obtention des données à jour
            const name = await getMissionName(missionId, { forceRefresh: true });
            console.log(`FormHeader - Nom de mission chargé: "${name}" pour ID: ${missionId}`);
            setMissionName(name);
          } catch (err) {
            console.error("FormHeader - Erreur lors du chargement du nom de mission:", err);
            setMissionName("Mission non identifiée");
          }
        }
      }
    } catch (err) {
      console.error("FormHeader - Erreur lors du chargement des valeurs du formulaire:", err);
    } finally {
      setIsLoadingMissionName(false);
    }
  };
  
  // Observer les changements de valeur pour missionId pour mettre à jour le nom
  useEffect(() => {
    if (editMode) {
      loadCurrentMissionName();
    }
  }, [control._formValues?.missionId, editMode]);
  
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
          // Garantir que la valeur est une chaîne de caractères
          const missionValue = field.value ? String(field.value) : "";
          console.log("FormHeader - Rendu avec missionId:", missionValue);
          
          // Cas spécial pour Freshworks - vérification directe de l'ID
          const isFreshworks = missionValue === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b";
          if (isFreshworks && missionName !== "Freshworks") {
            console.log("FormHeader - Correction du nom Freshworks détecté");
            setMissionName("Freshworks");
          }
          
          return (
            <FormItem>
              <FormLabel>Mission client</FormLabel>
              <FormControl>
                {editMode ? (
                  // En mode édition, affichage direct du nom avec gestion visuelle de l'état
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 relative">
                      <Input 
                        value={isLoadingMissionName ? "Chargement..." : missionName || "Mission non trouvée"}
                        disabled={true}
                        className={cn(
                          "bg-gray-100",
                          isLoadingMissionName ? "text-gray-400" : 
                          missionName ? "text-gray-900 font-medium" : 
                          "text-red-500"
                        )}
                      />
                      {isLoadingMissionName && (
                        <div className="absolute right-3 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <input type="hidden" {...field} value={missionValue} />
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
                      console.log("FormHeader - Sélection de mission:", value);
                      field.onChange(value);
                      
                      // Cas spécial pour Freshworks
                      if (value === "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b") {
                        setMissionName("Freshworks");
                        return;
                      }
                      
                      // Charger le nom pour affichage immédiat
                      setIsLoadingMissionName(true);
                      getMissionName(value, { forceRefresh: true }).then(name => {
                        console.log(`Mission sélectionnée: ${value} => "${name}"`);
                        setMissionName(name);
                        setIsLoadingMissionName(false);
                      }).catch(err => {
                        console.error("Erreur lors du chargement du nom:", err);
                        setIsLoadingMissionName(false);
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
