
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mission, MissionType } from "@/types/types";
import { updateMission } from "@/services/missionService";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import { cn } from "@/lib/utils";

// Définir le schéma de validation avec une méthode refine correcte pour la validation de date
const formSchema = z.object({
  name: z.string().min(1, "Le nom de la mission est requis"),
  client: z.string().optional(),
  sdrId: z.string().min(1, "Vous devez sélectionner un SDR"),
  description: z.string().optional(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  type: z.enum(["Full", "Part"]),
}).refine((data) => {
  // Si les deux dates sont définies, vérifier que la date de fin est après la date de début
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"], // Associer ce message d'erreur au champ endDate
});

interface EditMissionDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissionUpdated?: () => void;
}

export function EditMissionDialog({
  mission,
  open,
  onOpenChange,
  onMissionUpdated,
}: EditMissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch SDRs for assignment
  const { data: users = [], isLoading: isSdrsLoading } = useQuery({
    queryKey: ['users-for-mission-edit'],
    queryFn: getAllUsers,
    enabled: open, // Only fetch when dialog is open
  });

  const sdrs = users.filter(user => user.role === 'sdr');
  
  // Configurer le formulaire avec les valeurs de la mission
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      client: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full" as MissionType,
    },
  });
  
  // Mettre à jour les valeurs du formulaire quand la mission change
  useEffect(() => {
    if (mission) {
      form.reset({
        name: mission.name,
        client: mission.client || "",
        sdrId: mission.sdrId,
        description: mission.description || "",
        startDate: mission.startDate ? new Date(mission.startDate) : null,
        endDate: mission.endDate ? new Date(mission.endDate) : null,
        type: mission.type as MissionType,
      });
    }
  }, [mission, form]);
  
  // Fonction de soumission du formulaire
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!mission) return;
    
    try {
      console.log("Formulaire de mise à jour soumis avec les valeurs:", values);
      console.log("SDR ID sélectionné pour mise à jour:", values.sdrId);
      
      setIsSubmitting(true);
      
      const updatedMissionData = {
        id: mission.id,
        name: values.name,
        client: values.client || "",
        sdrId: values.sdrId,
        description: values.description || "",
        startDate: values.startDate,
        endDate: values.endDate,
        type: values.type,
      };
      
      console.log("Données préparées pour la mise à jour:", updatedMissionData);
      
      // Appel API pour mettre à jour
      await updateMission(updatedMissionData);
      
      onOpenChange(false);
      
      toast.success("Mission mise à jour", {
        description: "La mission a été mise à jour avec succès"
      });
      
      if (onMissionUpdated) {
        onMissionUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour", {
        description: "Une erreur est survenue lors de la mise à jour de la mission"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la mission</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Champ Nom */}
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
            
            {/* Champ SDR */}
            <FormField
              control={form.control}
              name="sdrId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Assigner à (SDR) <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un SDR" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isSdrsLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement des SDRs...
                        </SelectItem>
                      ) : (
                        sdrs.map((sdr) => (
                          <SelectItem key={sdr.id} value={sdr.id}>
                            {sdr.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date de démarrage */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de démarrage</FormLabel>
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
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date de fin */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de fin</FormLabel>
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
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const startDate = form.getValues("startDate");
                          return (
                            date < new Date("1900-01-01") ||
                            (startDate && date < startDate)
                          );
                        }}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Type de mission */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type de mission <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full">Full</SelectItem>
                      <SelectItem value="Part">Part</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Boutons d'action */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
