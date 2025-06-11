
import { useState, useCallback } from 'react';
import { Request } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useForceFiltering = (allRequests: Request[]) => {
  const [forceFilter, setForceFilter] = useState<string | null>(null);
  const { user } = useAuth();

  const applyForceFilter = useCallback((filterType: string) => {
    console.log(`🎯 FORCE FILTER: Applying ${filterType} (current: ${forceFilter})`);
    
    // Messages de toast correspondants - CORRECTION DES CLÉS
    const filterMessages: { [key: string]: string } = {
      'to_assign': 'demandes en attente d\'assignation',
      'my_assignments': 'mes demandes à traiter', 
      'completed': 'demandes terminées',
      'late': 'demandes en retard',
      'all': 'toutes les demandes',
      'pending': 'demandes en attente',
      'inprogress': 'demandes en cours'
    };

    // Si on clique sur le même filtre, le désactiver
    if (forceFilter === filterType) {
      console.log(`🎯 DÉSACTIVATION du filtre: ${filterType}`);
      setForceFilter(null);
      toast.info("Filtre désactivé");
      return null;
    }

    // Sinon, appliquer le nouveau filtre
    console.log(`🎯 ACTIVATION du filtre: ${filterType}`);
    setForceFilter(filterType);
    
    // Obtenir le bon message avec une vérification stricte
    const message = filterMessages[filterType];
    if (!message) {
      console.error(`🚨 ERREUR: Aucun message trouvé pour le filtre: ${filterType}`);
      console.error(`🚨 Filtres disponibles:`, Object.keys(filterMessages));
      toast.info(`Filtrage appliqué: ${filterType}`);
    } else {
      console.log(`🎯 TOAST MESSAGE CORRECT: "${message}" pour le filtre "${filterType}"`);
      toast.info(`Filtrage appliqué: ${message}`);
    }
    
    return filterType;
  }, [forceFilter]);

  const getForceFilteredRequests = useCallback(() => {
    console.log(`🔍 FORCE FILTERING START:`);
    console.log(`  - Current filter: ${forceFilter}`);
    console.log(`  - Total requests: ${allRequests?.length || 0}`);
    console.log(`  - User info:`, { id: user?.id, email: user?.email, name: user?.name });

    if (!forceFilter || !allRequests) {
      console.log(`🔍 NO FILTER: Returning all requests (${allRequests?.length || 0})`);
      return allRequests || [];
    }

    console.log(`🔍 APPLYING FILTER: ${forceFilter}`);

    switch (forceFilter) {
      case 'to_assign':
        const nonAssigned = allRequests.filter(req => {
          // Vérifier toutes les conditions pour une demande non assignée
          const isNotAssigned = !req.assigned_to || 
                               req.assigned_to === '' || 
                               req.assigned_to === null || 
                               req.assigned_to === 'Non assigné';
          console.log(`  - Request ${req.id}: assigned_to="${req.assigned_to}" -> isNotAssigned=${isNotAssigned}`);
          return isNotAssigned;
        });
        console.log(`🎯 FILTRE TO_ASSIGN: ${nonAssigned.length} demandes non assignées trouvées`);
        console.log(`🎯 Sample results:`, nonAssigned.slice(0, 3).map(r => ({ 
          id: r.id, 
          title: r.title, 
          assigned_to: r.assigned_to 
        })));
        return nonAssigned;

      case 'my_assignments':
        const myRequests = allRequests.filter(req => {
          // Vérifier si la demande est assignée à l'utilisateur actuel
          const isAssignedToMe = req.assigned_to === user?.id || 
                                req.assigned_to === user?.email || 
                                req.assigned_to === user?.name;
          console.log(`  - Request ${req.id}: assigned_to="${req.assigned_to}" vs user="${user?.id}"|"${user?.email}"|"${user?.name}" -> isAssignedToMe=${isAssignedToMe}`);
          return isAssignedToMe;
        });
        console.log(`🎯 FILTRE MY_ASSIGNMENTS: ${myRequests.length} demandes assignées à moi trouvées`);
        console.log(`🎯 Sample results:`, myRequests.slice(0, 3).map(r => ({ 
          id: r.id, 
          title: r.title, 
          assigned_to: r.assigned_to 
        })));
        return myRequests;

      case 'completed':
        const completed = allRequests.filter(req => req.workflow_status === 'completed');
        console.log(`🎯 FILTRE COMPLETED: ${completed.length} demandes terminées trouvées`);
        return completed;

      case 'late':
        const late = allRequests.filter(req => req.isLate);
        console.log(`🎯 FILTRE LATE: ${late.length} demandes en retard trouvées`);
        return late;

      case 'all':
        console.log(`🎯 FILTRE ALL: ${allRequests.length} demandes (toutes)`);
        return allRequests;

      default:
        console.log(`🎯 FILTRE INCONNU: ${forceFilter}, retour de toutes les demandes`);
        return allRequests;
    }
  }, [forceFilter, allRequests, user]);

  return {
    forceFilter,
    applyForceFilter,
    getForceFilteredRequests,
    clearForceFilter: () => {
      console.log(`🎯 CLEAR FORCE FILTER`);
      setForceFilter(null);
      toast.info("Filtre effacé");
    }
  };
};
