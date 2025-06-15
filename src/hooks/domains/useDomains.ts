
import { useQuery } from "@tanstack/react-query";
import { getDomains } from "@/services/domains/domainService";
import { DomainFilters } from "@/types/domains.types";

export const useDomains = (filters?: DomainFilters) => {
  return useQuery({
    queryKey: ['domains', filters],
    queryFn: () => getDomains(filters),
  });
};
