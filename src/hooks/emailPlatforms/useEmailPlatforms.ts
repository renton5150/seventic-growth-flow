
import { useQuery } from "@tanstack/react-query";
import { getEmailPlatforms, getFrontOffices, getEmailPlatformAccounts } from "@/services/emailPlatforms/emailPlatformService";
import { EmailPlatformAccountFilters } from "@/types/emailPlatforms.types";

export const useEmailPlatforms = () => {
  return useQuery({
    queryKey: ['email-platforms'],
    queryFn: getEmailPlatforms,
  });
};

export const useFrontOffices = () => {
  return useQuery({
    queryKey: ['front-offices'],
    queryFn: getFrontOffices,
  });
};

export const useEmailPlatformAccounts = (filters?: EmailPlatformAccountFilters) => {
  return useQuery({
    queryKey: ['email-platform-accounts', filters],
    queryFn: () => getEmailPlatformAccounts(filters),
  });
};
