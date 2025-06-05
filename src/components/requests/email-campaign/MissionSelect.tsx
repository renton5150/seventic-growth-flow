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
import { getMissionName, preloadMissionNames, syncKnownMissions, isFreshworksId, forceRefreshFreshworks } from "@/services/missionNameService";

export function MissionSelect() {
  const [missions, setMissions] = useState<{ id: string; name: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, setValue, watch } = useFormContext();
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const selectedMissionId = watch("missionId");

  useEffect(() => {
    // Initialisation - Force Freshworks au démarrage
    forceRefreshFreshworks();
    
    const fetchMissions = async () => {
      setLoading(true);
      try {
        console.log("MissionSelect - Démarrage du chargement des missions");
        console.log(`MissionSelect - Utilisateur: ${user?.role}, isSDR: ${isSDR}, isGrowth: ${isGrowth}`);
        
        // Synchroniser d'abord les missions connues pour s'assurer que le cache est à jour
        await syncKnownMissions();
        
        let query = supabase.from("missions").select("id, name, client");
        
        // Filtrage selon le rôle utilisateur
        if (isSDR && user?.id) {
          console.log("MissionSelect - Filtrage pour SDR avec user.id:", user.id);
          query = query.eq('sdr_id', user.id);
        } else if (isGrowth) {
          console.log("MissionSelect - Utilisateur Growth: récupération de toutes les missions");
          // Pour les utilisateurs Growth, on ne filtre pas - ils voient toutes les missions
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Erreur lors de la récupération des missions:", error);
          return;
        }
        
        console.log(`MissionSelect - ${data?.length || 0} missions récupérées de la base`);
        
        if (data && data.length) {
          // Précharger les noms de mission
          const missionIds = data
            .map(mission => mission.id)
            .filter((id): id is string => !!id);
            
          if (missionIds.length > 0) {
            console.log(`MissionSelect - Préchargement de ${missionIds.length} noms de mission`);
            await preloadMissionNames(missionIds);
          }
          
          // Préparer les données avec les noms standardisés
          const missionsWithDisplayName = await Promise.all(
            data.map(async mission => {
              // Vérification spéciale pour Freshworks
              if (isFreshworksId(mission.id)) {
                console.log(`MissionSelect - Mission Freshworks détectée: ${mission.id}`);
                return {
                  id: mission.id,
                  name: mission.name,
                  displayName: "Freshworks"
                };
              }
              
              const displayName = await getMissionName(mission.id, {
                fallbackClient: mission.client,
                fallbackName: mission.name,
                forceRefresh: true // Forcer le rafraîchissement pour obtenir les données les plus récentes
              });
              
              console.log(`MissionSelect - Mission ${mission.id}: "${displayName}"`);
              
              return {
                id: mission.id,
                name: mission.name,
                displayName
              };
            })
          );
          
          // S'assurer que les missions ont des IDs uniques
          const uniqueMissions = Array.from(
            new Map(missionsWithDisplayName.map(item => [item.id, item])).values()
          );
          
          console.log(`MissionSelect - ${uniqueMissions.length} missions uniques chargées`);
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
  }, [isSDR, isGrowth, user?.id]);
  
  // Effet pour vérifier si la mission sélectionnée existe dans la liste chargée
  useEffect(() => {
    if (!loading && selectedMissionId && missions.length > 0) {
      const missionExists = missions.some(m => m.id === selectedMissionId);
      if (!missionExists) {
        console.log(`MissionSelect - Mission sélectionnée ${selectedMissionId} non trouvée dans la liste chargée`);
        
        // Tenter de récupérer le nom de la mission sélectionnée
        const fetchSelectedMissionName = async () => {
          try {
            // Vérification spéciale pour Freshworks
            if (isFreshworksId(selectedMissionId)) {
              setMissions(prev => {
                if (!prev.some(m => m.id === selectedMissionId)) {
                  return [...prev, { 
                    id: selectedMissionId, 
                    name: "Freshworks", 
                    displayName: "Freshworks" 
                  }];
                }
                return prev;
              });
              return;
            }
            
            const name = await getMissionName(selectedMissionId, { forceRefresh: true });
            console.log(`MissionSelect - Nom récupéré pour la mission ${selectedMissionId}: "${name}"`);
            
            // Ajouter la mission à la liste si elle n'y est pas déjà
            setMissions(prev => {
              if (!prev.some(m => m.id === selectedMissionId)) {
                return [...prev, { 
                  id: selectedMissionId, 
                  name: name, 
                  displayName: name 
                }];
              }
              return prev;
            });
          } catch (err) {
            console.error("Erreur lors de la récupération du nom de la mission sélectionnée:", err);
          }
        };
        
        fetchSelectedMissionName();
      }
    }
  }, [selectedMissionId, missions, loading]);

  const handleMissionChange = (value: string) => {
    console.log(`MissionSelect - Mission sélectionnée: ${value}`);
    setValue("missionId", value, { shouldValidate: true });
    
    // Vérification spéciale pour Freshworks
    if (isFreshworksId(value)) {
      console.log("MissionSelect - Sélection de Freshworks détectée - traitement spécial");
      forceRefreshFreshworks();
    }
  };
  
  const getPlaceholderText = () => {
    if (loading) return "Chargement...";
    if (isSDR && missions.length === 0) return "Aucune mission ne vous est assignée";
    if (isGrowth && missions.length === 0) return "Aucune mission disponible";
    return "Sélectionner une mission";
  };

  const getEmptyStateText = () => {
    if (isSDR) return "Aucune mission ne vous est assignée";
    if (isGrowth) return "Aucune mission disponible";
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
