
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export function MissionSelect() {
  const [missions, setMissions] = useState<{ id: string; name: string; client: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';

  // Récupérer les missions en fonction du rôle de l'utilisateur
  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        let query = supabase.from("missions").select("id, name, client");
        
        // Si l'utilisateur est un SDR, ne récupérer que les missions où il est assigné
        if (isSDR && user?.id) {
          query = query.eq('sdr_id', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Erreur lors de la récupération des missions:", error);
          return;
        }
        
        if (data) {
          console.log("Missions récupérées:", data);
          setMissions(data);
        }
      } catch (error) {
        console.error("Exception lors de la récupération des missions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [isSDR, user?.id]);

  const handleMissionChange = (value: string) => {
    setValue("missionId", value, { shouldValidate: true });
  };

  // Surveiller la valeur de la mission
  const selectedMissionId = watch("missionId");

  // Formatter le nom de la mission pour l'affichage
  const getFormattedMissionName = (id: string) => {
    const mission = missions.find(m => m.id === id);
    return mission ? `${mission.name} - ${mission.client}` : "Sélectionner une mission";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="missionId" className="text-base">
          Mission*
        </Label>
      </div>
      
      <Select onValueChange={handleMissionChange} value={selectedMissionId}>
        <SelectTrigger className="w-full h-10">
          <SelectValue placeholder="Sélectionner une mission">
            {selectedMissionId ? getFormattedMissionName(selectedMissionId) : "Sélectionner une mission"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {loading ? (
              <SelectItem value="loading" disabled>
                Chargement...
              </SelectItem>
            ) : missions.length > 0 ? (
              missions.map((mission) => (
                <SelectItem key={mission.id} value={mission.id}>
                  {mission.name} - {mission.client}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                {isSDR 
                  ? "Aucune mission ne vous est assignée" 
                  : "Aucune mission trouvée"}
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <input type="hidden" {...register("missionId")} />
    </div>
  );
}
