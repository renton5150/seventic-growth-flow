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

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  console.log("FormHeader - Rendu avec editMode:", editMode);

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
          
          {/* Mission associée - Utilisation du composant MissionSelect qui a été mis à jour */}
          <FormField
            control={control}
            name="missionId"
            render={({ field }) => {
              console.log("FormHeader - Rendu du champ mission", field);
              console.log("FormHeader - Valeur du champ mission:", field.value);
              console.log("FormHeader - Type de la valeur du champ mission:", typeof field.value);
              
              return (
                <FormItem>
                  <FormLabel>Mission*</FormLabel>
                  <FormControl>
                    <MissionSelect />
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
