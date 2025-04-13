
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { Mission } from "@/types/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";

/**
 * Hook pour récupérer toutes les missions
 */
export const useAllMissions = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['missions', filters],
    queryFn: async () => {
      return apiService.get<Mission[]>('missions', {
        query: filters,
        order: { column: 'created_at', ascending: false }
      });
    }
  });
};

/**
 * Hook pour récupérer les missions d'un utilisateur spécifique
 */
export const useUserMissions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['missions', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      return apiService.get<Mission[]>('missions', {
        query: { sdr_id: userId },
        order: { column: 'created_at', ascending: false }
      });
    },
    enabled: !!userId
  });
};

/**
 * Hook pour récupérer les missions du SDR connecté
 */
export const useCurrentUserMissions = () => {
  const { user } = useAuth();
  
  return useUserMissions(user?.id);
};

/**
 * Hook pour récupérer une mission spécifique par ID
 */
export const useMission = (missionId: string | undefined) => {
  return useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      if (!missionId) return null;
      
      return apiService.get<Mission>('missions', {
        id: missionId,
        maybeSingle: true
      });
    },
    enabled: !!missionId
  });
};

/**
 * Hook pour créer une nouvelle mission
 */
export const useCreateMission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mission: Omit<MissionFormValues, 'id'>) => {
      // Formater les données pour l'API
      const formattedData = {
        ...mission,
        start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
        end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
        // Ajouter le champ client requis par le schéma
        client: mission.name,
        // Mapper les champs aux colonnes de la base de données
        sdr_id: mission.sdrId,
        // Supprimer les champs à ne pas envoyer
        startDate: undefined,
        endDate: undefined,
        sdrId: undefined
      };
      
      return apiService.post<Mission>('missions', formattedData);
    },
    onSuccess: () => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission créée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la mission', {
        description: error.message
      });
    }
  });
};

/**
 * Hook pour mettre à jour une mission existante
 */
export const useUpdateMission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (mission: MissionFormValues) => {
      if (!mission.id) {
        throw new Error("ID de mission manquant");
      }
      
      // Formater les données pour l'API
      const formattedData = {
        ...mission,
        start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
        end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
        // Ajouter le champ client requis par le schéma
        client: mission.name,
        // Mapper les champs aux colonnes de la base de données
        sdr_id: mission.sdrId,
        // Supprimer les champs à ne pas envoyer
        startDate: undefined,
        endDate: undefined,
        sdrId: undefined
      };
      
      console.log("Données de mission formatées pour mise à jour:", formattedData);
      
      return apiService.put<Mission>('missions', mission.id, formattedData);
    },
    onSuccess: (data, variables) => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission', variables.id] });
      toast.success('Mission mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour de la mission', {
        description: error.message
      });
    }
  });
};

/**
 * Hook pour supprimer une mission
 */
export const useDeleteMission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (missionId: string) => {
      return apiService.delete('missions', missionId);
    },
    onSuccess: (_, missionId) => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      toast.success('Mission supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de la mission', {
        description: error.message
      });
    }
  });
};
