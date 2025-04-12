
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { createMission } from "@/services/missionService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import { Loader2, CalendarIcon } from "lucide-react";
import { getAllMissions } from "@/services/missionService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MissionType } from "@/types/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CreateMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface MissionFormData {
  name: string;
  sdr_id?: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: MissionType;
}

export const CreateMissionDialog = ({ open, onOpenChange, onSuccess }: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState("");
  const form = useForm<MissionFormData>({
    defaultValues: {
      name: "",
      sdr_id: undefined,
      description: "",
      startDate: null,
      endDate: null,
      type: "Full"
    }
  });

  // Fetch SDRs for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-mission'],
    queryFn: () => getAllUsers(),
    enabled: open, // Only fetch when dialog is open
  });

  // Fetch existing missions for duplicate name validation
  const { data: existingMissions = [] } = useQuery({
    queryKey: ['existing-missions'],
    queryFn: () => getAllMissions(),
    enabled: open, // Only fetch when dialog is open
  });

  // Memoize existing mission names for efficient comparison
  const existingMissionNames = useMemo(() => {
    return existingMissions.map(mission => mission.name.trim().toLowerCase());
  }, [existingMissions]);

  const sdrs = users.filter(user => user.role === 'sdr');

  const validateMissionName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Le nom de la mission est obligatoire";
    }
    
    const exists = existingMissionNames.includes(trimmedName.toLowerCase());
    if (exists) {
      return "Une mission avec ce nom existe déjà";
    }
    
    return true;
  };

  const validateDates = (data: MissionFormData) => {
    if (data.startDate && data.endDate) {
      if (data.endDate < data.startDate) {
        setDateError("La date de fin doit être postérieure à la date de démarrage");
        return false;
      }
    }
    setDateError("");
    return true;
  };

  const onSubmit = async (data: MissionFormData) => {
    // Validate mission name for duplicates
    const nameValidation = validateMissionName(data.name);
    if (nameValidation !== true) {
      form.setError("name", { 
        type: "manual", 
        message: nameValidation 
      });
      return;
    }

    // Validate dates
    if (!validateDates(data)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Log pour débogage
      console.log("Données du formulaire:", data);
      console.log("SDR ID:", data.sdr_id);
      
      // Correction: s'assurer que sdrId est correctement passé
      // Note: nous utilisons sdrId (camelCase) dans l'API mais sdr_id (snake_case) dans le formulaire
      await createMission({
        name: data.name,
        client: "", // Sending empty string for client as it's removed from the form
        sdrId: data.sdr_id === 'unassigned' ? '' : (data.sdr_id || ''),
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type
      });
      
      toast.success('Mission créée avec succès');
      form.reset();
      onOpenChange(false);
      onSuccess(); // Refresh missions list
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une mission</DialogTitle>
          <DialogDescription>
            Ajouter une nouvelle mission pour un SDR
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nom de la mission <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom de la mission"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sdr_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigner à (SDR)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un SDR" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {sdrs.map((sdr) => (
                        <SelectItem key={sdr.id} value={sdr.id}>
                          {sdr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Date de démarrage <span className="text-red-500">*</span>
                  </FormLabel>
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
                        initialFocus
                        locale={fr}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          // Empêcher de sélectionner une date antérieure à la date de démarrage
                          const startDate = form.getValues("startDate");
                          return startDate ? date < startDate : false;
                        }}
                        initialFocus
                        locale={fr}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dateError && (
              <div className="text-sm text-red-500">{dateError}</div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type de mission <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la mission"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer la mission"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
