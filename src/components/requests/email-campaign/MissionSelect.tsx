
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  name: string;
}

interface MissionSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MissionSelect = ({ 
  value, 
  onChange, 
  disabled = false, 
  placeholder = "Sélectionner une mission" 
}: MissionSelectProps) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        
        // Utiliser requests_with_missions pour obtenir des données cohérentes de mission
        let { data: missionsData, error } = await supabase
          .from('requests_with_missions')
          .select('mission_id, mission_name')
          .order('mission_name', { ascending: true });
        
        if (error) throw error;
        
        if (missionsData) {
          // Dédupliquer les missions car plusieurs requêtes peuvent être liées à la même mission
          const uniqueMissions = Array.from(
            new Map(missionsData.map(item => [item.mission_id, {
              id: item.mission_id,
              name: item.mission_name
            }])).values()
          );
          
          console.log("MissionSelect - Missions uniques récupérées:", uniqueMissions);
          setMissions(uniqueMissions);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des missions:", error);
      } finally {
        setLoading(false);
      }
    };

    // Si nous n'avons pas de missions, on les charge
    if (missions.length === 0) {
      fetchMissions();
    }
  }, [missions.length]);

  // Vérifier si la valeur actuelle existe dans les options
  useEffect(() => {
    if (!loading && value && missions.length > 0) {
      const missionExists = missions.some(m => m.id === value);
      console.log(`MissionSelect - La mission ${value} existe dans les options: ${missionExists}`);
    }
  }, [loading, value, missions]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("MissionSelect - Nouvelle valeur sélectionnée:", e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <select
        className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        value={value || ""}
        onChange={handleChange}
        disabled={disabled || loading}
      >
        <option value="" disabled>
          {loading ? "Chargement des missions..." : placeholder}
        </option>
        {missions.map((mission) => (
          <option key={mission.id} value={mission.id}>
            {mission.name}
          </option>
        ))}
      </select>
    </div>
  );
};
