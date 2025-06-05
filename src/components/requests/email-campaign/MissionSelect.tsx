
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
import { getAllDirectMissions, getDirectMissionsForUser, getDirectMissionDisplayName, type MissionData } from "@/services/missions/directMissionService";

export function MissionSelect() {
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const selectedMissionId = watch("missionId");

  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        console.log("MissionSelect - Chargement des missions pour utilisateur:", user?.role);
        
        let availableMissions: MissionData[] = [];
        
        if (user?.role === 'sdr' && user?.id) {
          // SDR : seulement ses missions
          console.log("MissionSelect - Récupération des missions SDR pour:", user.id);
          availableMissions = await getDirectMissionsForUser(user.id);
          console.log(`MissionSelect - ${availableMissions.length} missions SDR récupérées`);
        } else if (user?.role === 'growth' || user?.role === 'admin') {
          // Growth/Admin : toutes les missions
          console.log("MissionSelect - Récupération de TOUTES les missions pour Growth/Admin");
          availableMissions = await getAllDirectMissions();
          console.log(`MissionSelect - ${availableMissions.length} missions récupérées pour Growth/Admin`);
        }
        
        console.log("MissionSelect - Missions disponibles:", availableMissions.map(m => ({
          id: m.id,
          displayName: getDirectMissionDisplayName(m)
        })));
        
        setMissions(availableMissions);
      } catch (error) {
        console.error("MissionSelect - Erreur lors du chargement des missions:", error);
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
  
  const getPlaceholderText = () => {
    if (loading) return "Chargement...";
    if (missions.length === 0) {
      if (user?.role === 'sdr') return "Aucune mission ne vous est assignée";
      return "Aucune mission disponible";
    }
    return "Sélectionner une mission";
  };

  const getEmptyStateText = () => {
    if (user?.role === 'sdr') return "Aucune mission ne vous est assignée";
    return "Aucune mission disponible";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="missionId" className="text-base">
          Mission*
        </Label>
      </div>
      
      <Select onValueChange={handleMissionChange} value={selectedMissionId || ""}>
        <SelectTrigger className="w-full h-10">
          <SelectValue placeholder={getPlaceholderText()} />
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
                  {getDirectMissionDisplayName(mission)}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                {getEmptyStateText()}
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <input type="hidden" {...register("missionId")} />
    </div>
  );
}
