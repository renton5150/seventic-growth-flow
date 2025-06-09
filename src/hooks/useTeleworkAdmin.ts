
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useTeleworkAdmin = () => {
  const { user, isAdmin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Initialiser avec l'utilisateur actuel
  useEffect(() => {
    if (user?.id && !selectedUserId) {
      setSelectedUserId(user.id);
    }
  }, [user?.id, selectedUserId]);

  // Récupérer tous les utilisateurs SDR et Growth pour les admins
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['telework-users'],
    queryFn: async (): Promise<User[]> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('role', ['sdr', 'growth'])
          .order('name');

        if (error) {
          console.error("Erreur lors de la récupération des utilisateurs:", error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        return [];
      }
    },
    enabled: isAdmin
  });

  return {
    allUsers,
    isLoadingUsers,
    selectedUserId,
    setSelectedUserId,
    isAdmin
  };
};
