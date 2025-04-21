
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

// Configuration des headers CORS pour permettre les requêtes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Accéder aux variables d'environnement de Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  // Vérifier que les variables d'environnement sont définies
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Variables d'environnement manquantes");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Configuration du serveur incorrecte"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Créer un client Supabase avec la clé de service
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données de la requête
    const { missionId } = await req.json();
    
    // Vérifier que l'ID de mission est fourni
    if (!missionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de mission manquant"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Tentative de suppression de la mission avec l'ID: ${missionId}`);
    
    // Vérifier si la mission existe avant de la supprimer
    const { data: missionExists, error: checkError } = await supabase
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Erreur lors de la vérification de l'existence de la mission:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur lors de la vérification: ${checkError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!missionExists) {
      console.error("Mission non trouvée:", missionId);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mission non trouvée"
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Effectuer la suppression avec le client service role
    const { error: deleteError } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId);

    if (deleteError) {
      console.error("Erreur de suppression:", deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur lors de la suppression: ${deleteError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Suppression réussie
    console.log(`Mission ${missionId} supprimée avec succès`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission supprimée avec succès"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Erreur inattendue:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erreur inattendue: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
