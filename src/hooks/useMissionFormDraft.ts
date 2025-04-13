
import { useState, useEffect, useCallback } from 'react';
import { MissionFormValues } from '@/types/types';

interface DraftOptions {
  id: string;
  enabled?: boolean;
}

export const useMissionFormDraft = (initialValues: Partial<MissionFormValues>, options: DraftOptions) => {
  const { id, enabled = true } = options;
  const draftKey = `mission_draft_${id}`;
  
  // État pour suivre les valeurs actuelles du formulaire
  const [formValues, setFormValues] = useState<Partial<MissionFormValues>>(initialValues);
  // État pour suivre si le brouillon a été chargé
  const [draftLoaded, setDraftLoaded] = useState(false);
  // État pour suivre si un brouillon existe
  const [hasDraft, setHasDraft] = useState(false);
  
  // Charger le brouillon du localStorage
  const loadDraft = useCallback(() => {
    if (!enabled) return false;
    
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        
        // Convertir les dates string en objets Date
        if (parsedDraft.startDate) {
          parsedDraft.startDate = new Date(parsedDraft.startDate);
        }
        if (parsedDraft.endDate) {
          parsedDraft.endDate = new Date(parsedDraft.endDate);
        }
        
        setFormValues(parsedDraft);
        setHasDraft(true);
        setDraftLoaded(true);
        return true;
      }
    } catch (error) {
      console.error("Erreur lors du chargement du brouillon:", error);
    }
    
    setDraftLoaded(true);
    return false;
  }, [draftKey, enabled]);
  
  // Sauvegarder le brouillon dans localStorage
  const saveDraft = useCallback((values: Partial<MissionFormValues>) => {
    if (!enabled) return;
    
    try {
      localStorage.setItem(draftKey, JSON.stringify(values));
      setHasDraft(true);
      setFormValues(values);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du brouillon:", error);
    }
  }, [draftKey, enabled]);
  
  // Supprimer le brouillon
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error("Erreur lors de la suppression du brouillon:", error);
    }
  }, [draftKey]);
  
  // Charger le brouillon au montage du composant
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);
  
  return {
    formValues,
    draftLoaded,
    hasDraft,
    saveDraft,
    clearDraft,
    loadDraft
  };
};
