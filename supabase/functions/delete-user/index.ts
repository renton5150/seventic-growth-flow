
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction delete-user appelée");
    
    // Créer un client Supabase avec la clé secrète pour avoir des permissions admin
    const supabaseClient = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Récupérer les données de la requête
    const requestData = await req.json().catch(err => {
      console.error("Erreur lors de la lecture du corps de la requête:", err);
      return {};
    });
    
    const { userId } = requestData;
    
    if (!userId) {
      console.error("ID utilisateur manquant dans la requête");
      return new Response(
        JSON.stringify({ error: "ID utilisateur requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentative de suppression de l'utilisateur avec l'ID: ${userId}`);

    try {
      // Supprimer d'abord le profil de l'utilisateur
      console.log("1. Suppression du profil de l'utilisateur...");
      const { error: profileDeleteError } = await supabaseClient
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileDeleteError) {
        console.warn("Avertissement lors de la suppression du profil:", profileDeleteError);
        // Continuer avec la suppression de l'utilisateur même si la suppression du profil échoue
      } else {
        console.log(`Profil de l'utilisateur ${userId} supprimé avec succès`);
      }
      
      // Ensuite, supprimer l'utilisateur de auth.users
      console.log("2. Suppression de l'utilisateur de auth.users...");
      const { error: userDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
      
      if (userDeleteError) {
        console.error("Erreur lors de la suppression de l'utilisateur:", userDeleteError);
        
        // Si le profil a été supprimé mais pas l'utilisateur, renvoyer un avertissement
        if (!profileDeleteError) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              warning: "Le profil a été supprimé mais il y a eu une erreur lors de la suppression du compte d'authentification." 
            }),
            { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userDeleteError.message 
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Si nous arrivons ici, tout s'est bien passé
      console.log(`Utilisateur ${userId} supprimé avec succès`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Utilisateur supprimé avec succès"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (innerError) {
      console.error("Erreur interne lors de la suppression:", innerError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: innerError instanceof Error ? innerError.message : String(innerError)
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de l'utilisateur:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
