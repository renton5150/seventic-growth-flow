
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teleworkService } from "@/services/teleworkService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTelework = (targetUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Utiliser l'ID cible ou l'ID de l'utilisateur actuel
  const userId = targetUserId || user?.id || '';

  // Récupération des jours de télétravail
  const { data: teleworkDays = [], isLoading, refetch } = useQuery({
    queryKey: ['telework', userId],
    queryFn: () => teleworkService.getTeleworkDays(userId),
    enabled: !!userId
  });

  // Mutation pour ajouter (seulement pour son propre planning)
  const addMutation = useMutation({
    mutationFn: (date: Date) => {
      if (targetUserId && targetUserId !== user?.id) {
        throw new Error("Vous ne pouvez pas modifier le planning d'un autre utilisateur");
      }
      return teleworkService.addTeleworkDay(user?.id || '', date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telework'] });
      toast.success("Jour de télétravail ajouté");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  });

  // Mutation pour supprimer (seulement pour son propre planning)
  const removeMutation = useMutation({
    mutationFn: (date: Date) => {
      if (targetUserId && targetUserId !== user?.id) {
        throw new Error("Vous ne pouvez pas modifier le planning d'un autre utilisateur");
      }
      return teleworkService.removeTeleworkDay(user?.id || '', date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telework'] });
      toast.success("Jour de télétravail supprimé");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  });

  // Mutation pour réinitialiser (seulement pour son propre planning)
  const resetMutation = useMutation({
    mutationFn: () => {
      if (targetUserId && targetUserId !== user?.id) {
        throw new Error("Vous ne pouvez pas modifier le planning d'un autre utilisateur");
      }
      return teleworkService.resetAllTelework(user?.id || '');
    },
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
