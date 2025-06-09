
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teleworkService } from "@/services/teleworkService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTelework = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupération des jours de télétravail
  const { data: teleworkDays = [], isLoading, refetch } = useQuery({
    queryKey: ['telework', user?.id],
    queryFn: () => teleworkService.getTeleworkDays(user?.id || ''),
    enabled: !!user?.id
  });

  // Mutation pour ajouter
  const addMutation = useMutation({
    mutationFn: (date: Date) => teleworkService.addTeleworkDay(user?.id || '', date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telework'] });
      toast.success("Jour de télétravail ajouté");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  });

  // Mutation pour supprimer
  const removeMutation = useMutation({
    mutationFn: (date: Date) => teleworkService.removeTeleworkDay(user?.id || '', date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telework'] });
      toast.success("Jour de télétravail supprimé");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  });

  // Mutation pour réinitialiser
  const resetMutation = useMutation({
    mutationFn: () => teleworkService.resetAllTelework(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telework'] });
      toast.success("Planning réinitialisé");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la réinitialisation");
    }
  });

  return {
    teleworkDays,
    isLoading,
    addTeleworkDay: addMutation.mutate,
    removeTeleworkDay: removeMutation.mutate,
    resetTelework: resetMutation.mutate,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isResetting: resetMutation.isPending,
    refetch
  };
};
