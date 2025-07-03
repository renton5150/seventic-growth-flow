
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

    console.log("[AI Chat] Récupération COMPLÈTE des données avec focus CRA...");

    // 1. Récupérer les utilisateurs et leurs profils complets
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar, created_at')
      .in('role', ['sdr', 'growth', 'admin']);

    // 2. Récupérer TOUTES les demandes avec détails complets
    const { data: requests } = await supabase
      .from('requests_with_missions')
      .select(`
        id, title, type, status, workflow_status, 
        created_by, assigned_to, due_date, created_at, updated_at,
        mission_id, mission_name, mission_client, sdr_name, assigned_to_name,
        target_role, details
      `);

    // 3. Récupérer TOUTES les missions avec leurs détails complets
    const { data: missions } = await supabase
      .from('missions')
      .select(`
        id, name, client, type, status, sdr_id, growth_id,
        start_date, end_date, created_at, updated_at, description,
        sdr:profiles!missions_sdr_id_fkey(name, email),
        growth:profiles!missions_growth_id_fkey(name, email)
      `);

    // 4. **RÉCUPÉRATION COMPLÈTE DES DONNÉES TÉLÉTRAVAIL**
    console.log("[AI Chat] Récupération des données de télétravail...");
    
    // Récupérer TOUTES les demandes de télétravail avec détails utilisateur
    const { data: teleworkRequests } = await supabase
      .from('work_schedule_requests')
      .select(`
        id, user_id, start_date, end_date, request_type, status, reason,
        is_exceptional, created_at, approved_at, approved_by,
        profiles!work_schedule_requests_user_id_fkey(name, email, role)
      `)
      .eq('request_type', 'telework')
      .eq('status', 'approved')
      .order('start_date', { ascending: false })
      .limit(200);

    // 5. **NOUVELLE SECTION CRUCIALE** - Récupérer TOUS les détails CRA avec jointures complètes
    console.log("[AI Chat] Récupération détaillée des données CRA...");
    
    // Récupérer tous les rapports CRA avec détails SDR
    const { data: craReports } = await supabase
      .from('daily_activity_reports')
      .select(`
        id, sdr_id, report_date, total_percentage, is_completed, comments,
        created_at, updated_at,
        profiles!daily_activity_reports_sdr_id_fkey(name, email)
      `)
      .order('report_date', { ascending: false })
      .limit(100);

    // Récupérer TOUS les temps de mission avec détails mission ET SDR
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
      .limit(200);

    // Récupérer TOUTES les opportunités avec détails complets
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
      .limit(300);

    // 5. Récupérer les statistiques des campagnes email (si disponibles)
    const { data: emailCampaigns } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .limit(20);

    console.log("[AI Chat] Données récupérées:", {
      teleworkRequests: teleworkRequests?.length || 0,
      craReports: craReports?.length || 0,
      missionTimes: missionTimes?.length || 0,
      opportunities: opportunities?.length || 0
    });

    // 6. **ANALYSE COMPLÈTE DES DONNÉES TÉLÉTRAVAIL**
    const teleworkAnalysis = {};
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    teleworkRequests?.forEach(request => {
      const userName = request.profiles?.name || 'Utilisateur Inconnu';
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      if (!teleworkAnalysis[userName]) {
        teleworkAnalysis[userName] = {
          totalDays: 0,
          thisMonth: 0,
          upcomingDays: [],
          recentDays: [],
          allRequests: []
        };
      }
      
      // Calculer le nombre de jours de télétravail
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      teleworkAnalysis[userName].totalDays += daysDiff;
      
      // Vérifier si c'est ce mois-ci
      if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
        teleworkAnalysis[userName].thisMonth += daysDiff;
      }
      
      // Séparer les jours futurs et passés
      if (startDate >= today) {
        teleworkAnalysis[userName].upcomingDays.push({
          startDate: request.start_date,
          endDate: request.end_date,
          reason: request.reason,
          isExceptional: request.is_exceptional
        });
      } else {
        teleworkAnalysis[userName].recentDays.push({
          startDate: request.start_date,
          endDate: request.end_date,
          reason: request.reason,
          isExceptional: request.is_exceptional
        });
      }
      
      teleworkAnalysis[userName].allRequests.push({
        startDate: request.start_date,
        endDate: request.end_date,
        reason: request.reason,
        isExceptional: request.is_exceptional,
        createdAt: request.created_at
      });
    });
    
    // Trier les jours à venir et passés
    Object.keys(teleworkAnalysis).forEach(userName => {
      teleworkAnalysis[userName].upcomingDays = teleworkAnalysis[userName].upcomingDays
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 10);
      teleworkAnalysis[userName].recentDays = teleworkAnalysis[userName].recentDays
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 10);
    });

    // 6. **ANALYSE DÉTAILLÉE DES DONNÉES CRA PAR MISSION ET SDR**
    const craAnalysis = {};
    
    // Analyser les temps passés par SDR et par mission
    missionTimes?.forEach(mt => {
      const sdrName = mt.daily_activity_reports?.profiles?.name || 'SDR Inconnu';
      const missionName = mt.missions?.name || 'Mission Inconnue';
      const client = mt.missions?.client || 'Client Inconnu';
      const reportDate = mt.daily_activity_reports?.report_date;
      
      if (!craAnalysis[sdrName]) {
        craAnalysis[sdrName] = {
          totalReports: 0,
          missions: {},
          totalTimePercentage: 0,
          recentActivity: []
        };
      }
      
      if (!craAnalysis[sdrName].missions[missionName]) {
        craAnalysis[sdrName].missions[missionName] = {
          client: client,
          totalTime: 0,
          sessionsCount: 0,
          averageTime: 0,
          recentSessions: []
        };
      }
      
      craAnalysis[sdrName].missions[missionName].totalTime += mt.time_percentage;
      craAnalysis[sdrName].missions[missionName].sessionsCount += 1;
      craAnalysis[sdrName].missions[missionName].averageTime = 
        craAnalysis[sdrName].missions[missionName].totalTime / craAnalysis[sdrName].missions[missionName].sessionsCount;
      
      craAnalysis[sdrName].missions[missionName].recentSessions.push({
        date: reportDate,
        percentage: mt.time_percentage,
        comment: mt.mission_comment
      });
      
      craAnalysis[sdrName].totalTimePercentage += mt.time_percentage;
      craAnalysis[sdrName].recentActivity.push({
        date: reportDate,
        mission: missionName,
        client: client,
        percentage: mt.time_percentage,
        comment: mt.mission_comment
      });
    });

    // Calculer les moyennes pour chaque SDR
    Object.keys(craAnalysis).forEach(sdrName => {
      craAnalysis[sdrName].totalReports = [...new Set(craAnalysis[sdrName].recentActivity.map(a => a.date))].length;
      craAnalysis[sdrName].recentActivity = craAnalysis[sdrName].recentActivity
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // 10 activités les plus récentes
    });

    // 7. **ANALYSE DES OPPORTUNITÉS PAR MISSION**
    const opportunitiesAnalysis = {};
    opportunities?.forEach(opp => {
      const missionName = opp.missions?.name || 'Mission Inconnue';
      const sdrName = opp.daily_activity_reports?.profiles?.name || 'SDR Inconnu';
      const reportDate = opp.daily_activity_reports?.report_date;
      
      if (!opportunitiesAnalysis[missionName]) {
        opportunitiesAnalysis[missionName] = {
          client: opp.missions?.client || 'Client Inconnu',
          opportunities5: [],
          opportunities10: [],
          opportunities20: [],
          totalOpportunities: 0,
          totalValue: 0,
          contributors: new Set()
        };
      }
      
      opportunitiesAnalysis[missionName].contributors.add(sdrName);
      opportunitiesAnalysis[missionName].totalOpportunities += 1;
      opportunitiesAnalysis[missionName].totalValue += opp.opportunity_value;
      
      if (opp.opportunity_value === 5) {
        opportunitiesAnalysis[missionName].opportunities5.push({
          name: opp.opportunity_name,
          sdr: sdrName,
          date: reportDate
        });
      } else if (opp.opportunity_value === 10) {
        opportunitiesAnalysis[missionName].opportunities10.push({
          name: opp.opportunity_name,
          sdr: sdrName,
          date: reportDate
        });
      } else if (opp.opportunity_value === 20) {
        opportunitiesAnalysis[missionName].opportunities20.push({
          name: opp.opportunity_name,
          sdr: sdrName,
          date: reportDate
        });
      }
    });

    // Convertir les Sets en Arrays pour la sérialisation
    Object.keys(opportunitiesAnalysis).forEach(mission => {
      opportunitiesAnalysis[mission].contributors = Array.from(opportunitiesAnalysis[mission].contributors);
    });

    // 8. Calculer les statistiques par utilisateur - LOGIQUE COMPLÈTE
    const userStats = users?.map(user => {
      if (user.role === 'sdr') {
        const userRequests = requests?.filter(req => req.created_by === user.id) || [];
        const userMissions = missions?.filter(mission => mission.sdr_id === user.id) || [];
        const fullMissions = userMissions.filter(mission => mission.type === 'Full');
        const activeMissions = userMissions.filter(mission => mission.status === 'En cours');
        const userCraReports = craReports?.filter(cra => cra.sdr_id === user.id) || [];
        const userCraAnalysis = craAnalysis[user.name] || {};
        
        return {
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          joinDate: user.created_at,
          requests: {
            total: userRequests.length,
            pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
            completed: userRequests.filter(req => req.workflow_status === 'completed').length,
            late: userRequests.filter(req => 
              req.workflow_status !== 'completed' && 
              req.workflow_status !== 'canceled' &&
              req.due_date && 
              new Date(req.due_date) < new Date()
            ).length,
            byType: {
              email: userRequests.filter(req => req.type === 'email').length,
              database: userRequests.filter(req => req.type === 'database').length,
              linkedin: userRequests.filter(req => req.type === 'linkedin').length
            }
          },
          missions: {
            total: userMissions.length,
            full: fullMissions.length,
            active: activeMissions.length,
            clients: [...new Set(userMissions.map(m => m.client))],
            clientsCount: [...new Set(userMissions.map(m => m.client))].length,
            details: userMissions.map(m => ({
              name: m.name,
              client: m.client,
              type: m.type,
              status: m.status,
              startDate: m.start_date,
              endDate: m.end_date
            }))
          },
          cra: {
            totalReports: userCraReports.length,
            completedReports: userCraReports.filter(cra => cra.is_completed).length,
            averagePercentage: userCraReports.length > 0 
              ? Math.round(userCraReports.reduce((sum, cra) => sum + (cra.total_percentage || 0), 0) / userCraReports.length)
              : 0,
            detailedAnalysis: userCraAnalysis
          }
        };
      } else if (user.role === 'growth' || user.role === 'admin') {
        const userRequests = requests?.filter(req => req.assigned_to === user.id) || [];
        const unassignedRequests = requests?.filter(req => !req.assigned_to && req.workflow_status !== 'completed' && req.workflow_status !== 'canceled') || [];
        const userMissions = missions?.filter(mission => mission.growth_id === user.id) || [];
        
        return {
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          joinDate: user.created_at,
          requests: {
            total: userRequests.length,
            pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
            completed: userRequests.filter(req => req.workflow_status === 'completed').length,
            late: userRequests.filter(req => 
              req.workflow_status !== 'completed' && 
              req.workflow_status !== 'canceled' &&
              req.due_date && 
              new Date(req.due_date) < new Date()
            ).length,
            unassigned: user.role === 'growth' ? unassignedRequests.length : 0,
            byType: {
              email: userRequests.filter(req => req.type === 'email').length,
              database: userRequests.filter(req => req.type === 'database').length,
              linkedin: userRequests.filter(req => req.type === 'linkedin').length
            }
          },
          missions: {
            total: userMissions.length,
            managed: userMissions.length,
            details: userMissions.map(m => ({
              name: m.name,
              client: m.client,
              type: m.type,
              status: m.status,
              sdrName: m.sdr?.name
            }))
          }
        };
      }
      return null;
    }).filter(Boolean);

    // 9. Statistiques globales des missions - COMPLÈTES
    const missionStats = {
      total: missions?.length || 0,
      active: missions?.filter(m => m.status === 'En cours').length || 0,
      completed: missions?.filter(m => m.status === 'Fin').length || 0,
      fullMissions: missions?.filter(m => m.type === 'Full').length || 0,
      clients: [...new Set(missions?.map(m => m.client) || [])],
      clientsCount: [...new Set(missions?.map(m => m.client) || [])].length,
      byClient: missions?.reduce((acc, mission) => {
        acc[mission.client] = (acc[mission.client] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    // 10. Statistiques globales des demandes - COMPLÈTES
    const requestStats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.workflow_status === 'pending_assignment' || r.workflow_status === 'in_progress').length || 0,
      completed: requests?.filter(r => r.workflow_status === 'completed').length || 0,
      late: requests?.filter(r => 
        r.workflow_status !== 'completed' && 
        r.workflow_status !== 'canceled' &&
        r.due_date && 
        new Date(r.due_date) < new Date()
      ).length || 0,
      unassigned: requests?.filter(r => !r.assigned_to && r.workflow_status !== 'completed' && r.workflow_status !== 'canceled').length || 0,
      byType: {
        email: requests?.filter(r => r.type === 'email').length || 0,
        database: requests?.filter(r => r.type === 'database').length || 0,
        linkedin: requests?.filter(r => r.type === 'linkedin').length || 0
      },
      byStatus: requests?.reduce((acc, req) => {
        acc[req.workflow_status] = (acc[req.workflow_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    // **CONSTRUIRE LE CONTEXTE ULTRA ENRICHI AVEC TOUTES LES DONNÉES**
    let dataContext = `
=== DONNÉES COMPLÈTES DE L'APPLICATION SEVENTIC ===
Application de gestion des demandes Growth et des missions client avec système CRA complet et télétravail.

=== 🏠 DONNÉES TÉLÉTRAVAIL COMPLÈTES ET DÉTAILLÉES ===
${Object.entries(teleworkAnalysis).map(([userName, analysis]) => `
🧑‍💻 ${userName}:
   📊 STATISTIQUES TÉLÉTRAVAIL:
   • Total jours télétravail: ${analysis.totalDays}
   • Ce mois-ci: ${analysis.thisMonth} jours
   
   📅 PROCHAINS TÉLÉTRAVAILS (${analysis.upcomingDays.length} planifiés):
   ${analysis.upcomingDays.map(day => `   • ${day.startDate}${day.endDate !== day.startDate ? ` → ${day.endDate}` : ''} - ${day.reason}${day.isExceptional ? ' (EXCEPTIONNEL)' : ''}`).join('\n')}
   
   📝 TÉLÉTRAVAILS RÉCENTS (${analysis.recentDays.length} derniers):
   ${analysis.recentDays.slice(0, 5).map(day => `   • ${day.startDate}${day.endDate !== day.startDate ? ` → ${day.endDate}` : ''} - ${day.reason}${day.isExceptional ? ' (EXCEPTIONNEL)' : ''}`).join('\n')}
`).join('')}

📊 PLANNING TÉLÉTRAVAIL GLOBAL:
${teleworkRequests ? teleworkRequests.slice(0, 20).map(req => {
  const userName = req.profiles?.name || 'Utilisateur Inconnu';
  const startDate = req.start_date;
  const endDate = req.end_date;
  const isUpcoming = new Date(startDate) >= new Date();
  return `• ${startDate}${endDate !== startDate ? ` → ${endDate}` : ''}: ${userName} - ${req.reason}${req.is_exceptional ? ' (EXCEPTIONNEL)' : ''} ${isUpcoming ? '🔮 FUTUR' : '📝 PASSÉ'}`;
}).join('\n') : 'Aucune donnée de télétravail'}

🔍 QUESTIONS TÉLÉTRAVAIL QUE TU PEUX TRAITER:
- "Qui sera en télétravail le [DATE] ?" 
- "Combien de jours de télétravail [PERSONNE] a-t-il ce mois ?"
- "Qui télétravaille le plus souvent ?"
- "Y a-t-il beaucoup de monde en télétravail cette semaine ?"
- "Quel est le planning télétravail de [PERSONNE] ?"

=== UTILISATEURS ET LEURS STATISTIQUES DÉTAILLÉES ===
${userStats?.map(stat => `
👤 ${stat.name} (${stat.role.toUpperCase()}) - ${stat.email}
   Membre depuis: ${stat.joinDate ? new Date(stat.joinDate).toLocaleDateString('fr-FR') : 'N/A'}
   
   📋 DEMANDES:
   • Total: ${stat.requests.total}
   • En attente: ${stat.requests.pending}
   • Terminées: ${stat.requests.completed}
   • En retard: ${stat.requests.late}
   ${stat.requests.unassigned !== undefined ? `• Non assignées (visible par Growth): ${stat.requests.unassigned}` : ''}
   • Par type: Email(${stat.requests.byType.email}), Database(${stat.requests.byType.database}), LinkedIn(${stat.requests.byType.linkedin})
   
   🎯 MISSIONS:
   • Total missions: ${stat.missions.total}
   ${stat.missions.full !== undefined ? `• Missions Full: ${stat.missions.full}` : ''}
   ${stat.missions.active !== undefined ? `• Missions actives: ${stat.missions.active}` : ''}
   ${stat.missions.managed !== undefined ? `• Missions gérées: ${stat.missions.managed}` : ''}
   ${stat.missions.clientsCount !== undefined ? `• Clients différents: ${stat.missions.clientsCount}` : ''}
   ${stat.missions.clients ? `• Clients: ${stat.missions.clients.join(', ')}` : ''}
   
   ${stat.cra ? `📊 CRA (Comptes Rendus d'Activité) - DONNÉES DÉTAILLÉES:
   • Rapports total: ${stat.cra.totalReports}
   • Rapports complétés: ${stat.cra.completedReports}
   • Pourcentage moyen: ${stat.cra.averagePercentage}%
   
   ${stat.cra.detailedAnalysis?.missions ? `🔍 TEMPS PASSÉ PAR MISSION (CRA DÉTAILLÉ):
   ${Object.entries(stat.cra.detailedAnalysis.missions).map(([missionName, missionData]) => `
     ▶ Mission "${missionName}" (${missionData.client}):
       - Temps total: ${missionData.totalTime}%
       - Sessions: ${missionData.sessionsCount}
       - Temps moyen par session: ${Math.round(missionData.averageTime)}%
       - Sessions récentes: ${missionData.recentSessions.slice(0, 3).map(s => `${s.date}(${s.percentage}%)`).join(', ')}
   `).join('')}
   
   📈 ACTIVITÉ CRA RÉCENTE:
   ${stat.cra.detailedAnalysis.recentActivity?.slice(0, 5).map(activity => `
     • ${activity.date}: ${activity.percentage}% sur "${activity.mission}" (${activity.client})${activity.comment ? ` - ${activity.comment}` : ''}`).join('')}` : ''}` : ''}
`).join('')}

=== 🎯 ANALYSE DÉTAILLÉE DES MISSIONS ET TEMPS CRA ===
${Object.entries(craAnalysis).map(([sdrName, analysis]) => `
📊 SDR: ${sdrName}
   • Total rapports CRA: ${analysis.totalReports}
   • Temps total déclaré: ${analysis.totalTimePercentage}%
   • Missions travaillées: ${Object.keys(analysis.missions).length}
   
   🎯 DÉTAIL PAR MISSION:
   ${Object.entries(analysis.missions).map(([missionName, missionData]) => `
     ▶ "${missionName}" (${missionData.client}):
       - Temps total: ${missionData.totalTime}%
       - Sessions: ${missionData.sessionsCount}
       - Moyenne: ${Math.round(missionData.averageTime)}%/session
   `).join('')}
`).join('')}

=== 💡 ANALYSE DES OPPORTUNITÉS PAR MISSION ===
${Object.entries(opportunitiesAnalysis).map(([missionName, oppData]) => `
🎯 Mission: "${missionName}" (${oppData.client})
   • Total opportunités: ${oppData.totalOpportunities}
   • Valeur totale: ${oppData.totalValue}%
   • Contributeurs: ${oppData.contributors.join(', ')}
   
   📊 RÉPARTITION PAR VALEUR:
   • 5%: ${oppData.opportunities5.length} (${oppData.opportunities5.map(o => o.name).slice(0, 3).join(', ')})
   • 10%: ${oppData.opportunities10.length} (${oppData.opportunities10.map(o => o.name).slice(0, 3).join(', ')})
   • 20%: ${oppData.opportunities20.length} (${oppData.opportunities20.map(o => o.name).slice(0, 3).join(', ')})
`).join('')}

=== MISSIONS DÉTAILLÉES ===
Total: ${missionStats.total} | Actives: ${missionStats.active} | Terminées: ${missionStats.completed} | Missions Full: ${missionStats.fullMissions}
Clients uniques: ${missionStats.clientsCount} - ${missionStats.clients.join(', ')}

Répartition par client:
${Object.entries(missionStats.byClient).map(([client, count]) => `• ${client}: ${count} mission(s)`).join('\n')}

Dernières missions:
${missions?.slice(0, 10).map(mission => `
• "${mission.name}" - ${mission.client}
  Type: ${mission.type} | Statut: ${mission.status}
  SDR: ${mission.sdr?.name || 'Non assigné'} | Growth: ${mission.growth?.name || 'Non assigné'}
  Période: ${mission.start_date || 'N/A'} → ${mission.end_date || 'N/A'}
`).join('')}

=== DEMANDES DÉTAILLÉES ===
Total: ${requestStats.total} | En attente: ${requestStats.pending} | Terminées: ${requestStats.completed} | En retard: ${requestStats.late} | Non assignées: ${requestStats.unassigned}

Par type:
• Email: ${requestStats.byType.email}
• Database: ${requestStats.byType.database}  
• LinkedIn: ${requestStats.byType.linkedin}

Par statut:
${Object.entries(requestStats.byStatus).map(([status, count]) => `• ${status}: ${count}`).join('\n')}

Dernières demandes:
${requests?.slice(0, 15).map(req => `
• "${req.title}" (${req.type})
  Statut: ${req.workflow_status} | Mission: ${req.mission_name || 'Sans mission'}
  Créée par: ${req.sdr_name || 'Inconnu'} | Assignée à: ${req.assigned_to_name || 'Non assigné'}
  Échéance: ${req.due_date ? new Date(req.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
  Client: ${req.mission_client || 'N/A'}
`).join('')}

=== STATISTIQUES GLOBALES ===
👥 Utilisateurs: ${users?.length || 0} (SDR: ${users?.filter(u => u.role === 'sdr').length || 0}, Growth: ${users?.filter(u => u.role === 'growth').length || 0}, Admin: ${users?.filter(u => u.role === 'admin').length || 0})
🎯 Missions: ${missionStats.total} (${missionStats.active} actives, ${missionStats.fullMissions} Full)
📋 Demandes: ${requestStats.total} (${requestStats.pending} en attente, ${requestStats.unassigned} non assignées)
🏢 Clients: ${missionStats.clientsCount} clients uniques

${emailCampaigns?.length ? `=== CAMPAGNES EMAIL ===
Total campagnes: ${emailCampaigns.length}
Dernières campagnes:
${emailCampaigns.slice(0, 5).map(camp => `• ${camp.name} - ${camp.subject} (${camp.status})`).join('\n')}` : ''}

${craReports?.length ? `=== RAPPORTS CRA RÉCENTS (COMPLETS) ===
${craReports.slice(0, 15).map(cra => `• ${cra.profiles?.name || 'SDR Inconnu'} - ${cra.report_date} (${cra.total_percentage}% - ${cra.is_completed ? 'Complété' : 'En cours'})`).join('\n')}` : ''}

=== 🔍 GUIDE D'INTERPRÉTATION DES DONNÉES ===
• MISSIONS = Projets clients assignés aux SDR/Growth (ex: "Mission Datatilt", "Mission Klee", "Mission Freshworks")
• DEMANDES = Tâches spécifiques dans le cadre des missions (campagnes email, création de bases, scraping LinkedIn)
• CRA = Comptes Rendus d'Activité quotidiens des SDR avec temps passé par mission et opportunités
• TEMPS CRA = Pourcentages de temps passé par mission (doit totaliser 100% par jour)
• OPPORTUNITÉS CRA = Projets/opportunités identifiés avec valeurs 5%, 10% ou 20%
• SDR = créent des demandes, remplissent les CRA quotidiens
• Growth = traitent les demandes assignées, supervisent les missions
• "En attente" pour SDR = demandes qu'ils ont créées en pending_assignment/in_progress
• "En attente" pour Growth = demandes qui leur sont assignées en pending_assignment/in_progress

📊 EXEMPLES DE QUESTIONS QUE TU PEUX TRAITER:
- "Combien de temps le SDR X a-t-il passé sur la mission Datatilt ?"
- "Quelles sont les opportunités identifiées sur la mission Y ?"
- "Quel SDR a le plus travaillé sur les missions Full ?"
- "Quelle est la répartition du temps de travail du SDR Z ?"
- "Combien d'opportunités 20% ont été identifiées ce mois ?"
`;

    console.log("[AI Chat] Envoi du contexte ULTRA ENRICHI à Claude avec", {
      totalCharacters: dataContext.length,
      craAnalysisKeys: Object.keys(craAnalysis),
      opportunitiesKeys: Object.keys(opportunitiesAnalysis)
    });

    // Appeler Claude avec le contexte ULTRA ENRICHI
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        system: `Tu es Claude, un assistant IA intégré dans Seventic, une application de gestion de demandes Growth/SDR et de missions client avec système CRA complet.

Tu as accès aux données COMPLÈTES et DÉTAILLÉES de l'application, y compris toutes les informations CRA (Comptes Rendus d'Activité). 

🎯 EXPERTISE PARTICULIÈRE SUR LES CRA:
- Tu comprends parfaitement les temps passés par chaque SDR sur chaque mission
- Tu peux analyser les pourcentages de temps de travail par mission et par SDR
- Tu connais toutes les opportunités identifiées (5%, 10%, 20%) par mission
- Tu peux calculer des statistiques précises sur l'activité des SDR
- Tu as accès aux commentaires et détails des sessions de travail

🏠 EXPERTISE TÉLÉTRAVAIL COMPLÈTE:
- Tu as accès à TOUS les jours de télétravail de chaque utilisateur (passés, présents, futurs)
- Tu peux répondre précisément à "Qui sera en télétravail le [DATE] ?"
- Tu connais les statistiques de télétravail par personne (fréquence, jours ce mois, etc.)
- Tu as accès aux raisons et détails de chaque demande de télétravail
- Tu peux analyser les patterns de télétravail (exceptionnel vs régulier)

📊 TYPES DE DONNÉES DISPONIBLES (ACCÈS COMPLET SANS RESTRICTION):
- Temps de travail détaillé par SDR et par mission (avec historique)
- Opportunités identifiées avec leurs valeurs et contributeurs
- Statistiques complètes des missions et des demandes
- Historique des activités CRA avec commentaires
- Relations entre SDR, missions, clients et temps passé
- TOUTES les données de télétravail (planning complet par utilisateur)
- Données de profils utilisateurs complètes
- Statistiques globales de l'application
- Campagnes email et leurs performances

🔍 RÈGLES D'ANALYSE:
- TOUJOURS utiliser les données CRA détaillées pour répondre aux questions sur le temps de travail
- Faire la distinction entre MISSIONS (projets clients) et DEMANDES (tâches spécifiques)
- Être précis sur les pourcentages et les calculs de temps
- Mentionner les sources de données (CRA, missions, demandes) dans tes réponses
- Donner des exemples concrets avec les noms des missions/SDR quand pertinent

Réponds de manière conversationnelle et précise aux questions sur tous les aspects de l'application, avec une expertise particulière sur les données CRA et l'activité des SDR.`,
        messages: [
          { 
            role: "user", 
            content: `Contexte des données COMPLÈTES avec focus CRA de l'application :\n${dataContext}\n\nQuestion de l'utilisateur : ${question}` 
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

    console.log("[AI Chat] Réponse reçue de Claude:", aiResponse.substring(0, 200) + "...");

    return new Response(
      JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString(),
        debug: {
          dataProcessed: {
            users: users?.length || 0,
            missions: missions?.length || 0,
            requests: requests?.length || 0,
            craReports: craReports?.length || 0,
            missionTimes: missionTimes?.length || 0,
            opportunities: opportunities?.length || 0,
            craAnalysisSDRs: Object.keys(craAnalysis).length,
            opportunitiesAnalyzed: Object.keys(opportunitiesAnalysis).length
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
