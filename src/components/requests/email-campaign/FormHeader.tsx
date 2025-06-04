
import * as React from "react";
import { User } from "@/types/types";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MissionSelect } from "./MissionSelect";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getMissionName } from "@/services/missionNameService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  const [missionName, setMissionName] = React.useState<string>("");
  const [isLoadingMissionName, setIsLoadingMissionName] = React.useState<boolean>(false);
  
  console.log("EmailFormHeader - Rendu avec editMode:", editMode);

  // Chargement initial du nom de la mission si on est en mode édition
  React.useEffect(() => {
    if (editMode) {
      const loadMissionName = async () => {
        try {
          // @ts-ignore - Accès aux valeurs actuelles du formulaire
          const currentValues = control._formValues;
          
          if (currentValues && currentValues.missionId) {
            setIsLoadingMissionName(true);
            console.log(`EmailFormHeader - Chargement du nom pour la mission ID: ${currentValues.missionId}`);
            
            const name = await getMissionName(currentValues.missionId, { forceRefresh: true });
            console.log(`EmailFormHeader - Nom de mission chargé: "${name}"`);
            
            setMissionName(name);
            setIsLoadingMissionName(false);
          }
        } catch (error) {
          console.error("EmailFormHeader - Erreur de chargement du nom de mission:", error);
          setMissionName("Mission non identifiée");
          setIsLoadingMissionName(false);
        }
      };
      
      loadMissionName();
    }
  }, [editMode, control._formValues]);

  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre de la campagne */}
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la campagne*</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Campagne de lancement produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Objet de la campagne - NOUVEAU CHAMP */}
          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objet*</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Découvrez notre nouveau produit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Type d'emailing */}
          <FormField
            control={control}
            name="emailType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type d'emailing*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type d'emailing" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="Mass email">Mass email</SelectItem>
                    <SelectItem value="Cold email">Cold email</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Mission associée - En mode édition, affiche le nom de la mission en lecture seule */}
          <FormField
            control={control}
            name="missionId"
            render={({ field }) => {
              console.log("EmailFormHeader - Rendu du champ mission", field);
              console.log("EmailFormHeader - Valeur du champ mission:", field.value);
              console.log("EmailFormHeader - Type de la valeur du champ mission:", typeof field.value);
              
              return (
                <FormItem>
                  <FormLabel>Mission*</FormLabel>
                  <FormControl>
                    {editMode ? (
                      // En mode édition, afficher le nom de la mission en lecture seule
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
                        <input type="hidden" name="missionId" value={field.value} />
                      </div>
                    ) : (
                      // En mode création, utiliser le sélecteur
                      <MissionSelect />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          
          {/* Date prévue */}
          <FormField
            control={control}
            name="dueDate"
            render={({ field }) => {
              const [dateValue, setDateValue] = React.useState<string>(field.value ?? "");
              const [selectedDate, setSelectedDate] = React.useState<Date | null>(field.value ? new Date(field.value) : null);
              const [selectedTime, setSelectedTime] = React.useState<string>("" + (field.value ? new Date(field.value).toTimeString().slice(0,5) : "12:00"));
              // Si le composant est réutilisé, on synchronise les props et le state
              React.useEffect(() => {
                if (field.value) {
                  const dateObj = new Date(field.value);
                  setSelectedDate(dateObj);
                  setSelectedTime(dateObj.toTimeString().slice(0,5)); // "HH:MM"
                }
              }, [field.value]);
              // Gère le changement date+heure
              const handleChangeDateTime = (date: Date | null, time: string) => {
                if (date && time) {
                  const [hour, minute] = time.split(":").map(Number);
                  const newDate = new Date(date);
                  newDate.setHours(hour || 0);
                  newDate.setMinutes(minute || 0);
                  // Met à jour le champ du formulaire RHF
                  field.onChange(newDate.toISOString());
                }
              };
              return (
                <FormItem>
                  <FormLabel>Date prévue*</FormLabel>
                  <div className="flex gap-2 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-60"/>
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Choisir une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate || undefined}
                          onSelect={(d) => {
                            setSelectedDate(d);
                            handleChangeDateTime(d, selectedTime);
                          }}
                          className={cn("p-3 pointer-events-auto")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="time"
                      className="bg-background border px-2 py-2 rounded text-muted-foreground"
                      value={selectedTime}
                      onChange={e => {
                        setSelectedTime(e.target.value);
                        handleChangeDateTime(selectedDate, e.target.value);
                      }}
                      step={60} // minutes
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          
          {/* Auteur */}
          <div>
            <label className="block text-sm font-medium mb-2">Auteur</label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-muted-foreground">
              {user ? user.email : "Utilisateur inconnu"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
