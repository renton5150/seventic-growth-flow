
import { useState, useCallback } from 'react';
import { Request } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useForceFiltering = (allRequests: Request[]) => {
  const [forceFilter, setForceFilter] = useState<string | null>(null);
  const { user } = useAuth();

  const applyForceFilter = useCallback((filterType: string) => {
    console.log(`🎯 FORCE FILTER: Applying ${filterType}`);
    
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
      setForceFilter(null);
      toast.info("Filtre désactivé");
      return null;
    }

    // Sinon, appliquer le nouveau filtre
    setForceFilter(filterType);
    const message = filterMessages[filterType] || 'demandes';
    toast.info(`Filtrage appliqué: ${message}`);
    
    return filterType;
  }, [forceFilter]);

  const getForceFilteredRequests = useCallback(() => {
    if (!forceFilter || !allRequests) {
      return allRequests;
    }

    console.log(`🔍 FORCE FILTERING: ${forceFilter} on ${allRequests.length} requests`);

    switch (forceFilter) {
      case 'to_assign':
        const nonAssigned = allRequests.filter(req => 
          !req.assigned_to || req.assigned_to === 'Non assigné' || req.assigned_to === ''
        );
        console.log(`🎯 Non-assigned requests: ${nonAssigned.length}`);
        return nonAssigned;

      case 'my_assignments':
        const myRequests = allRequests.filter(req => 
          req.assigned_to === user?.id || req.assigned_to === user?.email || req.assigned_to === user?.name
        );
        console.log(`🎯 My assigned requests: ${myRequests.length}`);
        return myRequests;

      case 'completed':
        return allRequests.filter(req => req.workflow_status === 'completed');

      case 'late':
        return allRequests.filter(req => req.isLate);

      default:
        return allRequests;
    }
  }, [forceFilter, allRequests, user]);

  return {
    forceFilter,
    applyForceFilter,
    getForceFilteredRequests,
    clearForceFilter: () => setForceFilter(null)
  };
};
