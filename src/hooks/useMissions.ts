
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  name: string;
  client: string;
}

export const useMissions = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async (): Promise<Mission[]> => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, name, client')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
};
