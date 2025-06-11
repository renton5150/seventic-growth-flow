
import { Request } from "@/types/types";

export interface FilterCounts {
  all: number;
  to_assign: number;
  my_assignments: number;
  pending: number;
  inprogress: number;
  completed: number;
  late: number;
}

export class GrowthFilterService {
  private userId: string | undefined;
  
  constructor(userId: string | undefined) {
    this.userId = userId;
  }
  
  /**
   * Filtrer les demandes actives (exclut completed et canceled)
   */
  getActiveRequests(allRequests: Request[]): Request[] {
    return allRequests.filter(req => 
      req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
    );
  }
  
  /**
   * Filtrage unique et centralisé pour TOUS les cas
   */
  filterRequests(filterType: string, allRequests: Request[]): Request[] {
    console.log(`[GrowthFilterService] 🔍 Filtrage "${filterType}" sur ${allRequests.length} demandes totales`);
    
    const activeRequests = this.getActiveRequests(allRequests);
    console.log(`[GrowthFilterService] 📊 Demandes actives: ${activeRequests.length}`);
    
    let filtered: Request[] = [];
    
    switch (filterType) {
      case 'all':
        filtered = activeRequests;
        break;
        
      case 'to_assign':
        filtered = activeRequests.filter(req => 
          !req.assigned_to || 
          req.assigned_to === '' || 
          req.assigned_to === null || 
          req.assigned_to === 'Non assigné'
        );
        break;
        
      case 'my_assignments':
        filtered = activeRequests.filter(req => 
          req.assigned_to === this.userId || 
          req.assigned_to === this.userId // Simplification: on utilise juste l'ID
        );
        break;
        
      case 'pending':
        filtered = activeRequests.filter(req => 
          req.status === "pending" || req.workflow_status === "pending_assignment"
        );
        break;
        
      case 'inprogress':
        filtered = activeRequests.filter(req => 
          req.workflow_status === "in_progress"
        );
        break;
        
      case 'completed':
        // Pour completed, on utilise TOUTES les demandes (pas juste actives)
        filtered = allRequests.filter(req => 
          req.workflow_status === "completed"
        );
        break;
        
      case 'late':
        filtered = activeRequests.filter(req => req.isLate);
        break;
        
      default:
        filtered = activeRequests;
    }
    
    console.log(`[GrowthFilterService] ✅ Résultat "${filterType}": ${filtered.length} demandes`);
    
    return filtered;
  }
  
  /**
   * Calculer tous les compteurs en une seule fois
   */
  calculateCounts(allRequests: Request[]): FilterCounts {
    const activeRequests = this.getActiveRequests(allRequests);
    
    const counts: FilterCounts = {
      all: activeRequests.length,
      to_assign: this.filterRequests('to_assign', allRequests).length,
      my_assignments: this.filterRequests('my_assignments', allRequests).length,
      pending: this.filterRequests('pending', allRequests).length,
      inprogress: this.filterRequests('inprogress', allRequests).length,
      completed: this.filterRequests('completed', allRequests).length,
      late: this.filterRequests('late', allRequests).length,
    };
    
    console.log("[GrowthFilterService] 📊 Compteurs calculés:", counts);
    
    return counts;
  }
}
