
import { useMemo } from "react";
import { Request } from "@/types/types";
import { GrowthFilterService } from "@/services/filtering/growthFilterService";

export const useGrowthDebug = (
  allRequests: Request[], 
  filteredRequests: Request[], 
  currentFilter: string,
  userId: string | undefined
) => {
  
  return useMemo(() => {
    const filterService = new GrowthFilterService(userId);
    const counts = filterService.calculateCounts(allRequests);
    const expectedFiltered = filterService.filterRequests(currentFilter, allRequests);
    
    const debug = {
      totalRawRequests: allRequests.length,
      activeRequests: filterService.getActiveRequests(allRequests).length,
      currentFilter,
      expectedCount: expectedFiltered.length,
      actualDisplayedCount: filteredRequests.length,
      isConsistent: expectedFiltered.length === filteredRequests.length,
      counts,
      // IDs pour debug détaillé
      expectedIds: expectedFiltered.map(r => r.id).sort(),
      actualIds: filteredRequests.map(r => r.id).sort(),
    };
    
    if (!debug.isConsistent) {
      console.warn("[GrowthDebug] ❌ INCOHÉRENCE DÉTECTÉE:", debug);
      
      const missingInActual = debug.expectedIds.filter(id => !debug.actualIds.includes(id));
      const extraInActual = debug.actualIds.filter(id => !debug.expectedIds.includes(id));
      
      if (missingInActual.length > 0) {
        console.warn("[GrowthDebug] 🔍 IDs manquants dans l'affichage:", missingInActual);
      }
      if (extraInActual.length > 0) {
        console.warn("[GrowthDebug] 🔍 IDs supplémentaires dans l'affichage:", extraInActual);
      }
    } else {
      console.log("[GrowthDebug] ✅ Cohérence parfaite:", debug);
    }
    
    return debug;
  }, [allRequests, filteredRequests, currentFilter, userId]);
};
