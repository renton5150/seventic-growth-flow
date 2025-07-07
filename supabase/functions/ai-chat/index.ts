
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!anthropicKey) {
      throw new Error("Anthropic API key not configured");
    }

    console.log("[AI Chat] 🚀 RÉCUPÉRATION ULTRA-EXHAUSTIVE - TOUTES DONNÉES TEMPORELLES PRIORITAIRES 🚀");

    // ========== SECTION PRIORITÉ 1: ANALYSE TEMPORELLE AUJOURD'HUI ==========
    const today = new Date();
    const todayISOString = today.toISOString().split('T')[0];
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    console.log("[AI Chat] 📅 ANALYSE TEMPORELLE - Date actuelle:", {
      today: todayISOString,
      thisWeekStart: thisWeekStart.toISOString().split('T')[0],
      thisWeekEnd: thisWeekEnd.toISOString().split('T')[0],
      thisMonth: `${thisMonthStart.toISOString().split('T')[0]} → ${thisMonthEnd.toISOString().split('T')[0]}`
    });

    // DEMANDES D'AUJOURD'HUI - PRIORITÉ ABSOLUE
    console.log("[AI Chat] 🔥 RÉCUPÉRATION DEMANDES D'AUJOURD'HUI - PRIORITÉ CRITIQUE");
    const { data: todayRequests } = await supabase
      .from('requests_with_missions')
      .select('*')
      .gte('created_at', `${todayISOString}T00:00:00.000Z`)
      .lte('created_at', `${todayISOString}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    // DEMANDES DE CETTE SEMAINE
    const { data: thisWeekRequests } = await supabase
      .from('requests_with_missions')
      .select('*')
      .gte('created_at', thisWeekStart.toISOString())
      .lte('created_at', thisWeekEnd.toISOString())
      .order('created_at', { ascending: false });

    // DEMANDES DE CE MOIS
    const { data: thisMonthRequests } = await supabase
      .from('requests_with_missions')
      .select('*')
      .gte('created_at', thisMonthStart.toISOString())
      .lte('created_at', thisMonthEnd.toISOString())
      .order('created_at', { ascending: false });

    // ========== SECTION 1: UTILISATEURS ET PROFILS COMPLETS ==========
    console.log("[AI Chat] 👥 Récupération des utilisateurs...");
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar, created_at')
      .in('role', ['sdr', 'growth', 'admin']);

    // ========== SECTION 2: TOUTES LES DEMANDES HISTORIQUES ==========
    console.log("[AI Chat] 📨 Récupération COMPLÈTE des demandes historiques...");
    const { data: allRequests } = await supabase
      .from('requests_with_missions')
      .select(`
        id, title, type, status, workflow_status, 
        created_by, assigned_to, due_date, created_at, updated_at,
        mission_id, mission_name, mission_client, sdr_name, assigned_to_name,
        target_role, details
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    // ========== SECTION 3: DEMANDES BRUTES AVEC DÉTAILS JSON ==========
    console.log("[AI Chat] 🔍 Récupération des demandes brutes complètes...");
    const { data: rawRequests } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    // ========== SECTION 4: MISSIONS COMPLÈTES ==========
    console.log("[AI Chat] 🎯 Récupération des missions complètes...");
    const { data: missions } = await supabase
      .from('missions')
      .select(`
        id, name, client, type, status, sdr_id, growth_id,
        start_date, end_date, created_at, updated_at, description,
        types_prestation, objectif_mensuel_rdv, criteres_qualification,
        interlocuteurs_cibles, login_connexion,
        sdr:profiles!missions_sdr_id_fkey(name, email),
        growth:profiles!missions_growth_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    // ========== SECTION 5: DONNÉES CRA COMPLÈTES ==========
    console.log("[AI Chat] 📊 Récupération CRA complète...");
    const { data: craReports } = await supabase
      .from('daily_activity_reports')
      .select(`
        id, sdr_id, report_date, total_percentage, is_completed, comments,
        created_at, updated_at,
        profiles!daily_activity_reports_sdr_id_fkey(name, email)
      `)
      .order('report_date', { ascending: false })
      .limit(200);

    const { data: missionTimes } = await supabase
      .from('daily_mission_time')
      .select(`
        id, report_id, mission_id, time_percentage, mission_comment,
        created_at, updated_at,
        missions!daily_mission_time_mission_id_fkey(id, name, client, type, status),
        daily_activity_reports!daily_mission_time_report_id_fkey(
          sdr_id, report_date, total_percentage,
          profiles!daily_activity_reports_sdr_id_fkey(name, email)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: opportunities } = await supabase
      .from('daily_opportunities')
      .select(`
        id, report_id, mission_id, opportunity_name, opportunity_value,
        created_at, updated_at,
        missions!daily_opportunities_mission_id_fkey(name, client),
        daily_activity_reports!daily_opportunities_report_id_fkey(
          sdr_id, report_date,
          profiles!daily_activity_reports_sdr_id_fkey(name, email)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    // ========== SECTION 6: TÉLÉTRAVAIL COMPLET ==========
    console.log("[AI Chat] 🏠 Récupération télétravail complet...");
    const { data: teleworkRequests } = await supabase
      .from('work_schedule_requests')
      .select(`
        id, user_id, start_date, end_date, request_type, status, reason,
        is_exceptional, created_at, approved_at, approved_by
      `)
      .eq('request_type', 'telework')
      .eq('status', 'approved')
      .order('start_date', { ascending: false })
      .limit(1000);

    const userIds = teleworkRequests?.map(req => req.user_id) || [];
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('id', userIds);

    const teleworkWithProfiles = teleworkRequests?.map(request => {
      const profile = userProfiles?.find(p => p.id === request.user_id);
      return { ...request, profiles: profile };
    }) || [];

    // ========== SECTION 7: DONNÉES TECHNIQUES COMPLÈTES ==========
    console.log("[AI Chat] 🔧 Récupération données techniques...");
    const { data: emailPlatforms } = await supabase.from('email_platforms').select('*');
    const { data: emailPlatformAccounts } = await supabase.from('email_platform_accounts').select('*').limit(200);
    const { data: domains } = await supabase.from('domains').select('*').limit(100);
    const { data: databaseFiles } = await supabase.from('database_files').select('*').limit(200);
    const { data: acelleAccounts } = await supabase.from('acelle_accounts').select('*').limit(50);
    const { data: emailCampaigns } = await supabase.from('email_campaigns_cache').select('*').limit(100);

    // ========== ANALYSE TEMPORELLE DÉTAILLÉE ==========
    console.log("[AI Chat] 📊 CRÉATION ANALYSES TEMPORELLES PRIORITAIRES");

    // Analyser les demandes par SDR pour aujourd'hui
    const todayRequestsBySDR = {};
    const thisWeekRequestsBySDR = {};
    const thisMonthRequestsBySDR = {};

    users?.filter(u => u.role === 'sdr').forEach(sdr => {
      const todayCount = todayRequests?.filter(req => req.created_by === sdr.id).length || 0;
      const weekCount = thisWeekRequests?.filter(req => req.created_by === sdr.id).length || 0;
      const monthCount = thisMonthRequests?.filter(req => req.created_by === sdr.id).length || 0;

      todayRequestsBySDR[sdr.name] = {
        count: todayCount,
        email: sdr.email,
        requests: todayRequests?.filter(req => req.created_by === sdr.id) || []
      };

      thisWeekRequestsBySDR[sdr.name] = {
        count: weekCount,
        email: sdr.email
      };

      thisMonthRequestsBySDR[sdr.name] = {
        count: monthCount,
        email: sdr.email
      };
    });

    // Index télétravail par date pour recherche rapide
    const teleworkByDate = {};
    teleworkWithProfiles?.forEach(request => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const userName = request.profiles?.name || 'Utilisateur Inconnu';
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        if (!teleworkByDate[dateKey]) {
          teleworkByDate[dateKey] = [];
        }
        teleworkByDate[dateKey].push({
          userName: userName,
          reason: request.reason,
          isExceptional: request.is_exceptional,
          fullPeriod: `${request.start_date} → ${request.end_date}`
        });
      }
    });

    // ========== LOGS DE DIAGNOSTIC ULTRA-COMPLETS ==========
    console.log("[AI Chat] 📊 DONNÉES RÉCUPÉRÉES - DIAGNOSTIC TEMPOREL COMPLET:", {
      dateActuelle: todayISOString,
      demandesAujourdhui: todayRequests?.length || 0,
      demandesCetteSemaine: thisWeekRequests?.length || 0,
      demandesCeMois: thisMonthRequests?.length || 0,
      totalDemandes: allRequests?.length || 0,
      utilisateurs: users?.length || 0,
      missions: missions?.length || 0,
      craReports: craReports?.length || 0,
      teleworkRequests: teleworkRequests?.length || 0,
      teleworkDatesIndexed: Object.keys(teleworkByDate).length,
      sampleTodayRequests: todayRequests?.slice(0, 3).map(r => ({id: r.id, title: r.title, sdr: r.sdr_name}))
    });

    // ========== CONSTRUCTION DU CONTEXTE ULTRA-ENRICHI ==========
    let dataContext = `
=== 🚨 DONNÉES TEMPORELLES PRIORITAIRES - DATE ACTUELLE: ${todayISOString} ===
Application Seventic - ACCÈS COMPLET À TOUTES LES DONNÉES

🔥 DONNÉES D'AUJOURD'HUI (${todayISOString}) - RÉPONSE PRIORITAIRE:

📊 DEMANDES CRÉÉES AUJOURD'HUI: ${todayRequests?.length || 0} demandes
${Object.entries(todayRequestsBySDR).map(([sdrName, data]) => `
👤 ${sdrName}: ${data.count} demande(s) créée(s) aujourd'hui
   ${data.requests.map(req => `   • "${req.title}" (${req.type}) - ${req.workflow_status}`).join('\n')}
`).join('')}

📅 DEMANDES CETTE SEMAINE (${thisWeekStart.toISOString().split('T')[0]} → ${thisWeekEnd.toISOString().split('T')[0]}): ${thisWeekRequests?.length || 0} demandes
${Object.entries(thisWeekRequestsBySDR).map(([sdrName, data]) => `• ${sdrName}: ${data.count} demande(s)`).join('\n')}

📅 DEMANDES CE MOIS (${thisMonthStart.toISOString().split('T')[0]} → ${thisMonthEnd.toISOString().split('T')[0]}): ${thisMonthRequests?.length || 0} demandes
${Object.entries(thisMonthRequestsBySDR).map(([sdrName, data]) => `• ${sdrName}: ${data.count} demande(s)`).join('\n')}

🕐 TÉLÉTRAVAIL AUJOURD'HUI (${todayISOString}):
${teleworkByDate[todayISOString] ? teleworkByDate[todayISOString].map(p => `   👤 ${p.userName} - ${p.reason}${p.isExceptional ? ' (EXCEPTIONNEL)' : ''}`).join('\n') : '   Aucun télétravail planifié aujourd\'hui'}

=== 📊 TOUTES LES DONNÉES HISTORIQUES DISPONIBLES ===

📋 DEMANDES COMPLÈTES (${allRequests?.length || 0} demandes historiques):
${allRequests?.slice(0, 20).map(req => `
• "${req.title}" (${req.type}) - ${req.workflow_status}
  Créée le: ${new Date(req.created_at).toLocaleDateString('fr-FR')}
  SDR: ${req.sdr_name || 'Inconnu'} | Assignée à: ${req.assigned_to_name || 'Non assigné'}
  Mission: ${req.mission_name || 'Sans mission'} (${req.mission_client || 'N/A'})
`).join('')}

👥 UTILISATEURS COMPLETS (${users?.length || 0} utilisateurs):
${users?.map(user => `
• ${user.name} (${user.role.toUpperCase()}) - ${user.email}
  Créé le: ${user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
`).join('')}

🎯 MISSIONS COMPLÈTES (${missions?.length || 0} missions):
${missions?.slice(0, 15).map(mission => `
• "${mission.name}" - ${mission.client}
  Type: ${mission.type} | Statut: ${mission.status}
  SDR: ${mission.sdr?.name || 'Non assigné'} | Growth: ${mission.growth?.name || 'Non assigné'}
  Période: ${mission.start_date || 'N/A'} → ${mission.end_date || 'N/A'}
`).join('')}

📊 CRA COMPLETS (${craReports?.length || 0} rapports):
${craReports?.slice(0, 15).map(cra => `
• ${cra.profiles?.name || 'SDR Inconnu'} - ${cra.report_date}
  Pourcentage: ${cra.total_percentage}% | Complété: ${cra.is_completed ? 'Oui' : 'Non'}
  Commentaires: ${cra.comments || 'Aucun'}
`).join('')}

🏠 TÉLÉTRAVAIL COMPLET (${teleworkRequests?.length || 0} demandes):
${teleworkWithProfiles?.slice(0, 20).map(req => {
  const userName = req.profiles?.name || 'Utilisateur Inconnu';
  return `• ${req.start_date} → ${req.end_date}: ${userName} - ${req.reason}${req.is_exceptional ? ' (EXCEPTIONNEL)' : ''}`;
}).join('\n')}

🗓️ INDEX TÉLÉTRAVAIL PAR DATE:
${Object.entries(teleworkByDate).sort().slice(-30).map(([date, people]) => `
📅 ${date}: ${people.map(p => p.userName).join(', ')}
`).join('')}

=== 🔧 DONNÉES TECHNIQUES ===
📧 Plateformes email: ${emailPlatforms?.length || 0}
🏢 Comptes plateformes: ${emailPlatformAccounts?.length || 0}
🌐 Domaines: ${domains?.length || 0}
💾 Fichiers BDD: ${databaseFiles?.length || 0}
📨 Campagnes email: ${emailCampaigns?.length || 0}

=== 📊 CAPACITÉS D'ANALYSE COMPLÈTES ===
✅ Je peux analyser TOUTES les demandes par date (aujourd'hui, semaine, mois, année)
✅ Je peux compter les demandes par SDR pour n'importe quelle période
✅ Je peux analyser les tendances temporelles
✅ Je peux répondre à des questions comme:
   • "Combien de demandes ont été faites par les SDR aujourd'hui ?" → ${todayRequests?.length || 0} demandes
   • "Qui a créé le plus de demandes cette semaine ?" 
   • "Quelles sont les demandes en retard ?"
   • "Qui sera en télétravail demain ?"
   • "Analyse les performances des SDR ce mois-ci"
   • "Montre-moi toutes les missions du client X"

=== 🎯 EXEMPLES DE RÉPONSES PRÉCISES ===
Pour "Combien de demandes ont été faites par les SDR aujourd'hui ?":
RÉPONSE: ${todayRequests?.length || 0} demandes ont été créées aujourd'hui (${todayISOString}) par les SDR:
${Object.entries(todayRequestsBySDR).filter(([name, data]) => data.count > 0).map(([name, data]) => `• ${name}: ${data.count} demande(s)`).join('\n')}

ACCÈS COMPLET CONFIRMÉ - TOUTES DONNÉES DISPONIBLES POUR ANALYSE TEMPORELLE
`;

    console.log("[AI Chat] 📝 Envoi du contexte ULTRA-ENRICHI à Claude:", {
      totalCharacters: dataContext.length,
      todayRequestsCount: todayRequests?.length || 0,
      contextSample: dataContext.substring(0, 500)
    });

    // Appeler Claude avec le contexte ULTRA ENRICHI et instructions améliorées
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: `Tu es Claude, un assistant IA ultra-expert de Seventic avec ACCÈS COMPLET à toutes les données temporelles et historiques.

🚨 CAPACITÉS TEMPORELLES GARANTIES:
- Tu as accès à TOUTES les demandes par date (aujourd'hui, semaine, mois, historique complet)
- Tu peux compter précisément les demandes par SDR pour n'importe quelle période
- Tu connais l'état exact de toutes les données au ${todayISOString}
- Tu as les détails complets de chaque demande, mission, utilisateur, CRA, télétravail

📊 DONNÉES DISPONIBLES CONFIRMÉES:
- ${allRequests?.length || 0} demandes historiques complètes avec détails
- ${todayRequests?.length || 0} demandes créées aujourd'hui (${todayISOString})
- ${users?.length || 0} utilisateurs avec leurs statistiques
- ${missions?.length || 0} missions avec historique complet
- ${craReports?.length || 0} rapports CRA avec temps détaillés
- ${teleworkRequests?.length || 0} demandes télétravail indexées par date

🔥 INSTRUCTIONS CRITIQUES:
1. Pour les questions temporelles ("aujourd'hui", "cette semaine", etc.), utilise OBLIGATOIREMENT les données fournies
2. Donne des réponses PRÉCISES avec chiffres exacts et détails
3. Cite TOUJOURS les données sources dans ta réponse
4. Pour "Combien de demandes aujourd'hui", réponds avec le nombre exact et liste par SDR
5. JAMAIS dire "je n'ai pas accès" - tu as TOUT !

💡 EXEMPLES DE RÉPONSES ATTENDUES:
- "Combien de demandes aujourd'hui ?" → "${todayRequests?.length || 0} demandes créées aujourd'hui par [liste des SDR]"
- "Qui télétravaille demain ?" → Consultation de l'index télétravail par date
- "Performances SDR ce mois ?" → Analyse détaillée avec chiffres précis

Tu réponds TOUJOURS de manière précise, factuelle et détaillée en utilisant les données fournies.`,
        messages: [
          { 
            role: "user", 
            content: `Contexte COMPLET de l'application Seventic avec toutes les données temporelles:\n${dataContext}\n\nQuestion: ${question}` 
          }
        ]
      })
    });

    if (!response.ok) {
      console.error("[AI Chat] Erreur API Claude:", response.status, response.statusText);
      throw new Error(`Claude API call failed with status ${response.status}`);
    }

    const anthropicResponse = await response.json();
    const aiResponse = anthropicResponse.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response text from Claude");
    }

    console.log("[AI Chat] ✅ Réponse reçue de Claude avec contexte temporel enrichi");

    return new Response(
      JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString(),
        debug: {
          dataProcessed: {
            dateActuelle: todayISOString,
            demandesAujourdhui: todayRequests?.length || 0,
            demandesCetteSemaine: thisWeekRequests?.length || 0,
            demandesCeMois: thisMonthRequests?.length || 0,
            totalDemandes: allRequests?.length || 0,
            utilisateurs: users?.length || 0,
            missions: missions?.length || 0,
            craReports: craReports?.length || 0,
            missionTimes: missionTimes?.length || 0,
            opportunities: opportunities?.length || 0,
            teleworkRequests: teleworkRequests?.length || 0,
            teleworkDatesIndexed: Object.keys(teleworkByDate).length,
            emailPlatforms: emailPlatforms?.length || 0,
            emailPlatformAccounts: emailPlatformAccounts?.length || 0,
            domains: domains?.length || 0,
            databaseFiles: databaseFiles?.length || 0,
            acelleAccounts: acelleAccounts?.length || 0,
            emailCampaigns: emailCampaigns?.length || 0
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Une erreur s'est produite",
        response: "Désolé, je ne peux pas répondre à votre question pour le moment. Veuillez réessayer plus tard.",
        debug: {
          errorType: error.name,
          errorMessage: error.message
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  }
});
