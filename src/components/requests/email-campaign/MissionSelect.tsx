
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
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
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  name: string;
  client: string;
  sdr_id: string | null;
}

export function MissionSelect() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const selectedMissionId = watch("missionId");

  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        console.log("MissionSelect - ULTRA SIMPLE - Chargement pour:", user?.role);
        
        let query = supabase
          .from('missions')
          .select('id, name, client, sdr_id')
          .order('name');

        // Filtrer selon le rôle
        if (user?.role === 'sdr' && user?.id) {
          query = query.eq('sdr_id', user.id);
        }
        // Growth et Admin voient tout (pas de filtre)
        
        const { data, error } = await query;
        
        if (error) {
          console.error("MissionSelect - Erreur Supabase:", error);
          setMissions([]);
          return;
        }

        const missionsData = data || [];
        console.log(`MissionSelect - ${missionsData.length} missions récupérées:`, missionsData);
        
        // Filtrer les missions qui ont un ID valide (non vide)
        const validMissions = missionsData.filter(mission => mission.id && mission.id.trim() !== '');
        setMissions(validMissions);
      } catch (error) {
        console.error("MissionSelect - Exception:", error);
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [user?.role, user?.id]);

  const handleMissionChange = (value: string) => {
    console.log(`MissionSelect - Mission sélectionnée: ${value}`);
    setValue("missionId", value, { shouldValidate: true });
  };
  
  const getMissionDisplayName = (mission: Mission): string => {
    if (mission.client && mission.client.trim()) {
      return mission.client.trim();
    }
    if (mission.name && mission.name.trim()) {
      return mission.name.trim();
    }
    return "Sans nom";
  };
  
  const getPlaceholderText = () => {
    if (loading) return "Chargement...";
    if (missions.length === 0) {
      if (user?.role === 'sdr') return "Aucune mission ne vous est assignée";
      return "Aucune mission disponible";
    }
    return "Sélectionner une mission";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="missionId" className="text-base">
          Mission*
        </Label>
      </div>
      
      <Select onValueChange={handleMissionChange} value={selectedMissionId || ""} disabled={loading || missions.length === 0}>
        <SelectTrigger className="w-full h-10">
          <SelectValue placeholder={getPlaceholderText()} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {missions.length > 0 && missions.map((mission) => (
              <SelectItem key={mission.id} value={mission.id}>
                {getMissionDisplayName(mission)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <input type="hidden" {...register("missionId")} />
    </div>
  );
}
