
import { User, Mission } from "@/types/types";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getAllMissions } from "@/services/missionService";
import { supabase } from "@/integrations/supabase/client";

interface FormHeaderProps {
  control: Control<any>;
  user: User | null;
  editMode?: boolean;
}

export const FormHeader = ({ control, user, editMode = false }: FormHeaderProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        
        // Utiliser la vue requests_with_missions pour obtenir des données cohérentes
        let { data: missionsData, error } = await supabase
          .from('missions')
          .select('id, name, client, status')
          .order('name', { ascending: true });
        
        console.log("FormHeader - Missions récupérées:", missionsData);
        
        if (error) throw error;
        
        if (missionsData) {
          setMissions(missionsData);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des missions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

  // Extraire la valeur de mission de control.getValues pour le débogage
  useEffect(() => {
    try {
      // @ts-ignore - Accès aux valeurs actuelles du formulaire pour le débogage
      const currentValues = control._formValues;
      if (currentValues) {
        console.log("FormHeader - Valeurs actuelles du formulaire:", currentValues);
        console.log("FormHeader - Mission ID dans les valeurs du form:", currentValues.missionId);
        console.log("FormHeader - Type de la mission ID dans le form:", typeof currentValues.missionId);
      }
    } catch (err) {
      console.log("Impossible d'accéder aux valeurs du formulaire pour le débogage");
    }
  }, [control]);

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
          
          {/* Mission associée */}
          <FormField
            control={control}
            name="missionId"
            render={({ field }) => {
              // Logs exhaustifs pour déboguer
              console.log("FormHeader - Rendu du champ mission");
              console.log("FormHeader - Valeur brute actuelle:", field.value);
              console.log("FormHeader - Type de la valeur:", typeof field.value);
              
              // S'assurer que la valeur est une chaîne de caractères valide
              const missionValue = field.value ? String(field.value) : "";
              console.log("FormHeader - Valeur après conversion:", missionValue);
              console.log("FormHeader - Missions disponibles:", missions.map(m => ({ id: m.id, name: m.name })));
              
              // Vérifier si la mission existe dans la liste des options
              const missionExists = missions.some(m => String(m.id) === missionValue);
              console.log("FormHeader - Mission trouvée dans les options:", missionExists);
              
              return (
                <FormItem>
                  <FormLabel>Mission*</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log("FormHeader - Nouvelle valeur sélectionnée:", value);
                      field.onChange(value);
                    }}
                    value={missionValue}
                    disabled={loading || editMode} // Désactiver pendant le chargement ou en mode édition
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={loading ? "Chargement des missions..." : "Sélectionner une mission"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {missions.map((mission) => (
                        <SelectItem key={mission.id} value={String(mission.id)}>
                          {mission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          
          {/* Date prévue */}
          <FormField
            control={control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date prévue*</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Auteur de la demande */}
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
