
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEdgeFunctionWakeup = () => {
  // Réveiller les Edge Functions de Supabase qui peuvent être endormies
  const wakeUpEdgeFunctions = useCallback(async (token: string | null) => {
    try {
      console.log("Réveil des Edge Functions...");
      
      if (!token) {
        console.warn("Pas de token disponible pour réveiller les Edge Functions");
        return false;
      }
      
      // Appeler une fonction simple pour réveiller l'environnement
      const { data, error } = await supabase.functions.invoke("ping", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (error) {
        console.error("Erreur lors du réveil des Edge Functions:", error);
        return false;
      }
      
      console.log("Edge Functions réveillées avec succès:", data);
      return true;
    } catch (error) {
      console.error("Erreur lors du réveil des Edge Functions:", error);
      return false;
    }
  }, []);

  return { wakeUpEdgeFunctions };
};
