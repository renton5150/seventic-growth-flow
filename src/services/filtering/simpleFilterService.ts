
import { SimpleRequest } from "@/services/requests/simpleRequestService";

export type SimpleFilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'late' | 'unassigned' | 'my_assignments';

export interface SimpleFilterCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
  late: number;
  unassigned: number;
  my_assignments: number;
}

export class SimpleFilterService {
  private userId: string | undefined;
  
  constructor(userId: string | undefined) {
    this.userId = userId;
  }
  
  /**
   * Filtrage ULTRA-SIMPLE sans complexité
   */
  filterRequests(filterType: SimpleFilterType, allRequests: SimpleRequest[]): SimpleRequest[] {
    console.log(`[SimpleFilterService] 🎯 Filtrage "${filterType}" sur ${allRequests.length} demandes`);
    
    let filtered: SimpleRequest[] = [];
    
    switch (filterType) {
      case 'all':
        filtered = allRequests;
        break;
        
      case 'pending':
        filtered = allRequests.filter(req => 
          req.workflow_status === 'pending_assignment' || req.status === 'pending'
        );
        break;
        
      case 'in_progress':
        filtered = allRequests.filter(req => req.workflow_status === 'in_progress');
        break;
        
      case 'completed':
        filtered = allRequests.filter(req => req.workflow_status === 'completed');
        break;
        
      case 'late':
        filtered = allRequests.filter(req => req.isLate);
        break;
        
      case 'unassigned':
        filtered = allRequests.filter(req => 
          !req.assigned_to || req.assigned_to === '' || req.assigned_to === null
        );
        break;
        
      case 'my_assignments':
        filtered = allRequests.filter(req => req.assigned_to === this.userId);
        break;
        
      default:
        filtered = allRequests;
    }
    
    console.log(`[SimpleFilterService] ✅ Résultat pour "${filterType}": ${filtered.length} demandes`);
    
    return filtered;
  }
  
  /**
   * Calcul des compteurs SIMPLE
   */
  calculateCounts(allRequests: SimpleRequest[]): SimpleFilterCounts {
    return {
      all: allRequests.length,
      pending: this.filterRequests('pending', allRequests).length,
      in_progress: this.filterRequests('in_progress', allRequests).length,
      completed: this.filterRequests('completed', allRequests).length,
      late: this.filterRequests('late', allRequests).length,
      unassigned: this.filterRequests('unassigned', allRequests).length,
      my_assignments: this.filterRequests('my_assignments', allRequests).length,
    };
  }
}
