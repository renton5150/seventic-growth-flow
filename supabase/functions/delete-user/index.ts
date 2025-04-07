
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

    // Vérifier l'authentification de la requête
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Erreur d'authentification: token manquant ou invalide");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est autorisé (admin uniquement)
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Erreur d'authentification:", authError);
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est un admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return new Response(
        JSON.stringify({ error: "Impossible de vérifier les permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile || profile.role !== "admin") {
      console.error("Accès non autorisé pour l'utilisateur:", user.id);
      return new Response(
        JSON.stringify({ error: "Autorisé uniquement pour les administrateurs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les données de la requête
    const { userId } = await req.json();
    if (!userId) {
      console.error("ID utilisateur manquant dans la requête");
      return new Response(
        JSON.stringify({ error: "ID utilisateur requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentative de suppression de l'utilisateur avec l'ID: ${userId}`);

    // Vérifier si l'utilisateur existe avant de tenter de le supprimer
    const { data: userExists, error: userCheckError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userCheckError || !userExists) {
      console.error("Utilisateur non trouvé:", userId);
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Utiliser Promise.race pour définir un timeout
    const deletePromise = supabaseClient.auth.admin.deleteUser(userId);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Délai d'attente dépassé")), 10000);
    });

    // Supprimer l'utilisateur avec un timeout
    const { error: deleteError } = await Promise.race([deletePromise, timeoutPromise])
      .catch(error => {
        console.error("Erreur lors de la suppression:", error.message);
        return { error };
      });

    if (deleteError) {
      console.error("Erreur lors de la suppression de l'utilisateur:", deleteError);
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Utilisateur ${userId} supprimé avec succès`);
    return new Response(
      JSON.stringify({ success: true, message: "Utilisateur supprimé avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de l'utilisateur:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
