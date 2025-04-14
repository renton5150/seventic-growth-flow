
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as apiService from "@/services/apiService";
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
      console.log("Fetching all missions with filters:", filters);
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
      
      console.log("Fetching missions for user:", userId);
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
      
      console.log("Fetching single mission with ID:", missionId);
      return apiService.get<Mission>('missions', {
        query: { id: missionId },  // Changed this to use query instead of id
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
      console.log("Creating new mission:", mission);
      
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
    },
    onError: (error: any) => {
      console.error("Error creating mission:", error);
      toast.error('Erreur lors de la création de la mission', {
        description: error.message || "Veuillez réessayer"
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
      
      console.log("Updating mission:", mission);
      
      // Formater les données pour l'API mais sans inclure le champ user_role directement dans l'objet
      const formattedData = {
        ...mission,
        start_date: mission.startDate ? new Date(mission.startDate).toISOString() : null,
        end_date: mission.endDate ? new Date(mission.endDate).toISOString() : null,
        // Ajouter le champ client requis par le schéma
        client: mission.name,
        // Mapper les champs aux colonnes de la base de données
        sdr_id: mission.sdrId
        // Ne pas inclure user_role ici, il sera géré par le service
      };
      
      console.log("Formatted data for update:", formattedData);
      
      // Passer le rôle utilisateur comme second paramètre à la fonction PUT
      return apiService.put<Mission>('missions', mission.id, formattedData, {
        userRole: user?.role
      });
    },
    onSuccess: (data, variables) => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission', variables.id] });
    },
    onError: (error: any) => {
      console.error("Error updating mission:", error);
      toast.error('Erreur lors de la mise à jour de la mission', {
        description: error.message || "Veuillez réessayer"
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
      console.log("Deleting mission with ID:", missionId);
      return apiService.deleteResource('missions', missionId);
    },
    onSuccess: (_, missionId) => {
      // Invalider les requêtes concernées
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      toast.success('Mission supprimée avec succès');
    },
    onError: (error: any) => {
      console.error("Error deleting mission:", error);
      toast.error('Erreur lors de la suppression de la mission', {
        description: error.message || "Veuillez réessayer"
      });
    }
  });
};
