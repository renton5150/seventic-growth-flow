
import { User } from "@supabase/supabase-js";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Mission } from "@/types/types";
import { getMissions } from "@/services/missionService";

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
        const data = await getMissions();
        setMissions(data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des missions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mission*</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={editMode} // Désactiver le changement de mission en mode édition
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={loading ? "Chargement des missions..." : "Sélectionner une mission"} 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name} ({mission.client})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
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
