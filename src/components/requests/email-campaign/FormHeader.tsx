
import { User } from "@/types/types";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MissionSelect } from "./MissionSelect";

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
          
          {/* Mission associée - Utilisation du nouveau composant MissionSelect */}
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
                    <MissionSelect
                      value={field.value ? String(field.value) : ""}
                      onChange={field.onChange}
                      disabled={editMode}
                      placeholder="Sélectionner une mission"
                    />
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
