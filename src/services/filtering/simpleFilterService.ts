
import { SimpleRequest } from "@/services/requests/simpleRequestService";

export type SimpleFilterType = 'all' | 'in_progress' | 'completed' | 'late';

export interface SimpleFilterCounts {
  all: number;
  in_progress: number;
  completed: number;
  late: number;
}

export class SimpleFilterService {
  private userId: string | undefined;
  
  constructor(userId: string | undefined) {
    this.userId = userId;
  }
  
  /**
   * Filtrage ULTRA-SIMPLE basé sur la logique qui fonctionne
   */
  filterRequests(filterType: SimpleFilterType, allRequests: SimpleRequest[]): SimpleRequest[] {
    console.log(`[SimpleFilterService] 🎯 Filtrage "${filterType}" sur ${allRequests.length} demandes`);
    
    let filtered: SimpleRequest[] = [];
    
    switch (filterType) {
      case 'all':
        // COPIE EXACTE de la logique qui fonctionne pour "Total"
        filtered = allRequests;
        break;
        
      case 'in_progress':
        // COPIE EXACTE de la logique qui fonctionne pour "En retard" mais pour in_progress
        filtered = allRequests.filter(req => req.workflow_status === 'in_progress');
        break;
        
      case 'completed':
        // COPIE EXACTE de la logique qui fonctionne pour "En retard" mais pour completed
        filtered = allRequests.filter(req => req.workflow_status === 'completed');
        break;
        
      case 'late':
        // COPIE EXACTE de la logique qui fonctionne pour "En retard"
        filtered = allRequests.filter(req => req.isLate);
        break;
        
      default:
        filtered = allRequests;
    }
    
    console.log(`[SimpleFilterService] ✅ Résultat pour "${filterType}": ${filtered.length} demandes`);
    
    return filtered;
  }
  
  /**
   * Calcul des compteurs SIMPLE - seulement ceux qui fonctionnent
   */
  calculateCounts(allRequests: SimpleRequest[]): SimpleFilterCounts {
    return {
      all: allRequests.length,
      in_progress: this.filterRequests('in_progress', allRequests).length,
      completed: this.filterRequests('completed', allRequests).length,
      late: this.filterRequests('late', allRequests).length,
    };
  }
}
