import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Mission, TypePrestation } from "@/types/types";
import { MissionFormValues, missionFormSchema } from "../schemas/missionFormSchema";
import { DateField } from "../form-fields/DateField";
import { SdrSelector } from "../form-fields/SdrSelector";
import { MissionTypeSelector } from "../form-fields/MissionTypeSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth";

interface MissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (values: MissionFormValues) => void;
  onCancel: () => void;
  defaultStartDate?: Date | null;
}

const typesPrestation: TypePrestation[] = ["Call", "Email marketing", "Cold email", "Social selling"];

export function MissionForm({ 
  mission, 
  isSubmitting, 
  onSubmit, 
  onCancel,
  defaultStartDate
}: MissionFormProps) {
  const [formInitialized, setFormInitialized] = useState(false);
  const { isAdmin, user } = useAuth();
  
  // Admin, Growth et SDR peuvent tous modifier les missions
  const canEditMission = isAdmin || user?.role === "growth" || user?.role === "sdr";
  
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: defaultStartDate || null,
      endDate: null,
      type: "Full",
      status: "En cours",
      objectifMensuelRdv: "",
      typesPrestation: [],
      criteresQualification: "",
      interlocuteursCibles: "",
      loginConnexion: "",
    },
  });

  // Mettre à jour les valeurs du formulaire quand la mission change
  useEffect(() => {
    if (mission) {
      console.log("Initialisation du formulaire d'édition avec les valeurs de mission:", mission);
      console.log("Status actuel de la mission:", mission.status);
      try {
        form.reset({
          name: mission.name,
          sdrId: mission.sdrId || "",
          description: mission.description || "",
          startDate: mission.startDate ? new Date(mission.startDate) : null,
          endDate: mission.endDate ? new Date(mission.endDate) : null,
          type: mission.type,
          status: mission.status || "En cours",
          objectifMensuelRdv: mission.objectifMensuelRdv || "",
          typesPrestation: mission.typesPrestation || [],
          criteresQualification: mission.criteresQualification || "",
          interlocuteursCibles: mission.interlocuteursCibles || "",
          loginConnexion: mission.loginConnexion || "",
        });
        setFormInitialized(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du formulaire:", error);
      }
    } else if (defaultStartDate) {
      // Pour une nouvelle mission avec une date par défaut
      // Si c'est un SDR, le pré-sélectionner automatiquement
      const defaultSdrId = user?.role === "sdr" ? user.id : "";
      
      form.reset({
        name: "",
        sdrId: defaultSdrId,
        description: "",
        startDate: defaultStartDate,
        endDate: null,
        type: "Full",
        status: "En cours",
        objectifMensuelRdv: "",
        typesPrestation: [],
        criteresQualification: "",
        interlocuteursCibles: "",
        loginConnexion: "",
      });
      setFormInitialized(true);
    } else {
      // Pour une nouvelle mission sans date par défaut
      // Si c'est un SDR, le pré-sélectionner automatiquement
      const defaultSdrId = user?.role === "sdr" ? user.id : "";
      
      form.reset({
        name: "",
        sdrId: defaultSdrId,
        description: "",
        startDate: null,
        endDate: null,
        type: "Full",
        status: "En cours",
        objectifMensuelRdv: "",
        typesPrestation: [],
        criteresQualification: "",
        interlocuteursCibles: "",
        loginConnexion: "",
      });
      setFormInitialized(true);
    }
  }, [mission, defaultStartDate, form, user]);

  const startDate = form.watch("startDate");
  const currentStatus = form.watch("status");

  useEffect(() => {
    // Log lorsque le statut change dans le formulaire
    console.log("Statut actuel dans le formulaire:", currentStatus);
  }, [currentStatus]);

  if (!formInitialized && mission) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Chargement du formulaire...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <SdrSelector 
          control={form.control} 
          disabled={isSubmitting} 
          initialSdrName={mission?.sdrName}
        />

        <DateField 
          control={form.control}
          name="startDate"
          label="Date de démarrage"
          disabled={isSubmitting}
        />

        <DateField 
          control={form.control}
          name="endDate"
          label="Date de fin"
          disabled={isSubmitting}
          minDate={form.watch("startDate")}
        />

        <MissionTypeSelector 
          control={form.control} 
          disabled={isSubmitting} 
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut mission</FormLabel>
              <Select
                onValueChange={(value) => {
                  console.log("Changement de statut sélectionné:", value);
                  field.onChange(value);
                }}
                defaultValue={field.value}
                disabled={!isAdmin || isSubmitting}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className={!isAdmin ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Fin">Terminée</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objectifMensuelRdv"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectif mensuel RDV</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nombre de RDV mensuels"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typesPrestation"
          render={() => (
            <FormItem>
              <FormLabel>Type de prestation vendue</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {typesPrestation.map((type) => (
                  <FormField
                    key={type}
                    control={form.control}
                    name="typesPrestation"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={type}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type)}
                              onCheckedChange={(checked) => {
                                const value = field.value || [];
                                return checked
                                  ? field.onChange([...value, type])
                                  : field.onChange(value.filter((val) => val !== type));
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {type}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="criteresQualification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critères de qualification</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Définir les critères de qualification d'un rendez-vous"
                  className="resize-none"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interlocuteursCibles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interlocuteurs cibles</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Indiquer les interlocuteurs que l'on doit toucher dans l'opération"
                  className="resize-none"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loginConnexion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Login de connexion</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Ensemble des logins et passwords de connexion aux différents comptes de la mission"
                  className="resize-none"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mission ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              mission ? "Mettre à jour" : "Créer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
