
import { useState, useCallback } from 'react';
import { Request } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useForceFiltering = (allRequests: Request[]) => {
  const [forceFilter, setForceFilter] = useState<string | null>(null);
  const { user } = useAuth();

  const applyForceFilter = useCallback((filterType: string) => {
    console.log(`🎯 FORCE FILTER: Applying ${filterType} (current: ${forceFilter})`);
    
    // Messages de toast correspondants
    const filterMessages = {
      'to_assign': 'demandes en attente d\'assignation',
      'my_assignments': 'mes demandes à traiter', 
      'completed': 'demandes terminées',
      'late': 'demandes en retard',
      'all': 'toutes les demandes'
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
    
    // Obtenir le bon message
    const message = filterMessages[filterType] || filterType;
    console.log(`🎯 TOAST MESSAGE: ${message} pour le filtre ${filterType}`);
    toast.info(`Filtrage appliqué: ${message}`);
    
    return filterType;
  }, [forceFilter]);

  const getForceFilteredRequests = useCallback(() => {
    if (!forceFilter || !allRequests) {
      console.log(`🔍 FORCE FILTERING: Aucun filtre ou pas de demandes`);
      return allRequests;
    }

    console.log(`🔍 FORCE FILTERING: ${forceFilter} on ${allRequests.length} requests`);

    switch (forceFilter) {
      case 'to_assign':
        const nonAssigned = allRequests.filter(req => 
          !req.assigned_to || req.assigned_to === 'Non assigné' || req.assigned_to === '' || req.assigned_to === null
        );
        console.log(`🎯 FILTRE TO_ASSIGN: ${nonAssigned.length} demandes non assignées trouvées`);
        console.log(`🎯 Exemples:`, nonAssigned.slice(0, 3).map(r => ({ id: r.id, title: r.title, assigned_to: r.assigned_to })));
        return nonAssigned;

      case 'my_assignments':
        // Chercher les demandes assignées à l'utilisateur courant
        const myRequests = allRequests.filter(req => {
          const isAssignedToMe = req.assigned_to === user?.id || 
                                req.assigned_to === user?.email || 
                                req.assigned_to === user?.name ||
                                req.assigned_to === 'Corentin Boussard' ||
                                req.assigned_to === 'growth';
          return isAssignedToMe;
        });
        console.log(`🎯 FILTRE MY_ASSIGNMENTS: ${myRequests.length} demandes assignées à moi trouvées`);
        console.log(`🎯 User info:`, { id: user?.id, email: user?.email, name: user?.name });
        console.log(`🎯 Exemples:`, myRequests.slice(0, 3).map(r => ({ id: r.id, title: r.title, assigned_to: r.assigned_to })));
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
        console.log(`🎯 FILTRE INCONNU: ${filterType}, retour de toutes les demandes`);
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
