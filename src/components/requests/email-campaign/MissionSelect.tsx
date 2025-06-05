
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
  const [missions, setMissions] = useState<{ id: string; name: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';
  const selectedMissionId = watch("missionId");

  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        console.log("MissionSelect - Démarrage du chargement des missions");
        console.log(`MissionSelect - Utilisateur: ${user?.role}, isSDR: ${isSDR}, isGrowth: ${isGrowth}, isAdmin: ${isAdmin}`);
        
        let query = supabase.from("missions").select("id, name, client");
        
        // CORRECTION CRITIQUE : Filtrage selon le rôle utilisateur
        if (isSDR && user?.id) {
          console.log("MissionSelect - Filtrage pour SDR avec user.id:", user.id);
          query = query.eq('sdr_id', user.id);
        } else if (isGrowth || isAdmin) {
          console.log("MissionSelect - Utilisateur Growth/Admin: récupération de TOUTES les missions (pas de filtrage)");
          // IMPORTANT : Pour les utilisateurs Growth et Admin, on ne filtre PAS par sdr_id
          // Ils doivent voir toutes les missions disponibles
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Erreur lors de la récupération des missions:", error);
          return;
        }
        
        console.log(`MissionSelect - ${data?.length || 0} missions récupérées de la base`);
        
        if (data && data.length) {
          // Préparer les données avec les noms standardisés
          const missionsWithDisplayName = data.map(mission => {
            let displayName = "Sans nom";
            
            // PRIORITÉ: client d'abord, puis name
            if (mission.client && String(mission.client).trim() !== '') {
              displayName = String(mission.client).trim();
              console.log(`MissionSelect - Mission ${mission.id}: CLIENT="${displayName}"`);
            } else if (mission.name && String(mission.name).trim() !== '') {
              displayName = String(mission.name).trim();
              console.log(`MissionSelect - Mission ${mission.id}: NAME="${displayName}"`);
            } else {
              console.log(`MissionSelect - Mission ${mission.id}: AUCUN NOM VALIDE`);
            }
            
            return {
              id: mission.id,
              name: mission.name,
              displayName
            };
          });
          
          // S'assurer que les missions ont des IDs uniques
          const uniqueMissions = Array.from(
            new Map(missionsWithDisplayName.map(item => [item.id, item])).values()
          );
          
          console.log(`MissionSelect - ${uniqueMissions.length} missions uniques chargées`);
          console.log(`MissionSelect - Missions disponibles:`, uniqueMissions.map(m => ({ id: m.id, displayName: m.displayName })));
          setMissions(uniqueMissions);
        } else {
          console.log("MissionSelect - Aucune mission trouvée");
        }
      } catch (error) {
        console.error("Exception lors de la récupération des missions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [isSDR, isGrowth, isAdmin, user?.id]);
  
  // Effet pour vérifier si la mission sélectionnée existe dans la liste chargée
  useEffect(() => {
    if (!loading && selectedMissionId && missions.length > 0) {
      const missionExists = missions.some(m => m.id === selectedMissionId);
      if (!missionExists) {
        console.log(`MissionSelect - Mission sélectionnée ${selectedMissionId} non trouvée dans la liste chargée`);
        
        // Tenter de récupérer la mission sélectionnée
        const fetchSelectedMission = async () => {
          try {
            const { data: missionData, error } = await supabase
              .from('missions')
              .select('id, name, client')
              .eq('id', selectedMissionId)
              .single();
            
            if (!error && missionData) {
              let displayName = "Sans nom";
              if (missionData.client && String(missionData.client).trim() !== '') {
                displayName = String(missionData.client).trim();
              } else if (missionData.name && String(missionData.name).trim() !== '') {
                displayName = String(missionData.name).trim();
              }
              
              console.log(`MissionSelect - Mission sélectionnée récupérée: ${selectedMissionId} = "${displayName}"`);
              
              // Ajouter la mission à la liste si elle n'y est pas déjà
              setMissions(prev => {
                if (!prev.some(m => m.id === selectedMissionId)) {
                  return [...prev, { 
                    id: selectedMissionId, 
                    name: missionData.name || "", 
                    displayName: displayName 
                  }];
                }
                return prev;
              });
            } else {
              console.error("Erreur lors de la récupération de la mission sélectionnée:", error);
            }
          } catch (err) {
            console.error("Exception lors de la récupération de la mission sélectionnée:", err);
          }
        };
        
        fetchSelectedMission();
      }
    }
  }, [selectedMissionId, missions, loading]);

  const handleMissionChange = (value: string) => {
    console.log(`MissionSelect - Mission sélectionnée: ${value}`);
    setValue("missionId", value, { shouldValidate: true });
  };
  
  const getPlaceholderText = () => {
    if (loading) return "Chargement...";
    if (isSDR && missions.length === 0) return "Aucune mission ne vous est assignée";
    if ((isGrowth || isAdmin) && missions.length === 0) return "Aucune mission disponible";
    return "Sélectionner une mission";
  };

  const getEmptyStateText = () => {
    if (isSDR) return "Aucune mission ne vous est assignée";
    if (isGrowth || isAdmin) return "Aucune mission disponible";
    return "Aucune mission trouvée";
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
                  {mission.displayName || mission.name}
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
