
import { supabase } from "@/integrations/supabase/client";
import { DailyActivityReport, DailyMissionTime, DailyOpportunity, CreateCRARequest, CRAStatistics } from "@/types/cra.types";

export const craService = {
  // Créer ou mettre à jour un CRA
  async createOrUpdateCRA(data: CreateCRARequest): Promise<DailyActivityReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Calculer le pourcentage total
    const totalPercentage = data.mission_times.reduce((sum, mt) => sum + mt.time_percentage, 0);
    
    if (totalPercentage > 100) {
      throw new Error("Le total des pourcentages ne peut pas dépasser 100%");
    }

    // Créer ou mettre à jour le rapport principal
    const { data: report, error: reportError } = await supabase
      .from('daily_activity_reports')
      .upsert({
        sdr_id: user.id,
        report_date: data.report_date,
        total_percentage: totalPercentage,
        comments: data.comments,
        is_completed: totalPercentage === 100
      }, {
        onConflict: 'sdr_id,report_date'
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Supprimer les anciens temps de mission
    await supabase
      .from('daily_mission_time')
      .delete()
      .eq('report_id', report.id);

    // Supprimer les anciennes opportunités
    await supabase
      .from('daily_opportunities')
      .delete()
      .eq('report_id', report.id);

    // Insérer les nouveaux temps de mission
    if (data.mission_times.length > 0) {
      const { error: missionTimeError } = await supabase
        .from('daily_mission_time')
        .insert(
          data.mission_times.map(mt => ({
            report_id: report.id,
            mission_id: mt.mission_id,
            time_percentage: mt.time_percentage,
            mission_comment: mt.mission_comment
          }))
        );

      if (missionTimeError) throw missionTimeError;
    }

    // Insérer les nouvelles opportunités
    if (data.opportunities.length > 0) {
      const { error: opportunityError } = await supabase
        .from('daily_opportunities')
        .insert(
          data.opportunities.map(opp => ({
            report_id: report.id,
            mission_id: opp.mission_id,
            opportunity_name: opp.opportunity_name,
            opportunity_value: opp.opportunity_value
          }))
        );

      if (opportunityError) throw opportunityError;
    }

    return report;
  },

  // Récupérer un CRA pour une date donnée
  async getCRAByDate(date: string, sdrId?: string): Promise<{
    report: DailyActivityReport | null;
    missionTimes: DailyMissionTime[];
    opportunities: DailyOpportunity[];
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const targetSdrId = sdrId || user.id;

    // Récupérer le rapport
    const { data: report } = await supabase
      .from('cra_reports_with_details')
      .select('*')
      .eq('sdr_id', targetSdrId)
      .eq('report_date', date)
      .maybeSingle();

    if (!report) {
      return { report: null, missionTimes: [], opportunities: [] };
    }

    // Récupérer les temps de mission avec les détails
    const { data: missionTimes } = await supabase
      .from('daily_mission_time')
      .select(`
        *,
        missions:mission_id (
          name,
          client
        )
      `)
      .eq('report_id', report.id);

    // Récupérer les opportunités avec les détails
    const { data: opportunities } = await supabase
      .from('daily_opportunities')
      .select(`
        *,
        missions:mission_id (
          name
        )
      `)
      .eq('report_id', report.id);

    return {
      report,
      missionTimes: missionTimes?.map(mt => ({
        ...mt,
        mission_name: mt.missions?.name,
        mission_client: mt.missions?.client
      })) || [],
      opportunities: opportunities?.map(opp => ({
        ...opp,
        mission_name: opp.missions?.name
      })) || []
    };
  },

  // Récupérer les CRA d'une période
  async getCRAsByPeriod(startDate: string, endDate: string, sdrId?: string): Promise<DailyActivityReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    let query = supabase
      .from('cra_reports_with_details')
      .select('*')
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .order('report_date', { ascending: false });

    if (sdrId) {
      query = query.eq('sdr_id', sdrId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  // Récupérer les statistiques consolidées
  async getCRAStatistics(startDate: string, endDate: string, sdrId?: string): Promise<CRAStatistics[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Cette requête complexe sera optimisée avec une fonction Postgres si nécessaire
    const { data: reports } = await supabase
      .from('daily_activity_reports')
      .select(`
        *,
        daily_mission_time (
          mission_id,
          time_percentage,
          missions (
            name,
            client
          )
        ),
        daily_opportunities (
          mission_id,
          opportunity_value,
          missions (
            name
          )
        ),
        profiles (
          name
        )
      `)
      .gte('report_date', startDate)
      .lte('report_date', endDate)
      .eq(sdrId ? 'sdr_id' : 'sdr_id', sdrId || user.id);

    // Traitement côté client pour consolider les statistiques
    // Cette logique pourrait être déplacée vers une fonction Postgres pour de meilleures performances
    const stats: { [key: string]: any } = {};

    reports?.forEach(report => {
      const sdrKey = report.sdr_id;
      if (!stats[sdrKey]) {
        stats[sdrKey] = {
          sdr_id: report.sdr_id,
          sdr_name: report.profiles?.name || 'Inconnu',
          period: `${startDate} - ${endDate}`,
          total_reports: 0,
          mission_breakdown: {}
        };
      }

      stats[sdrKey].total_reports++;

      // Traiter les temps de mission
      report.daily_mission_time?.forEach((mt: any) => {
        const missionKey = mt.mission_id;
        if (!stats[sdrKey].mission_breakdown[missionKey]) {
          stats[sdrKey].mission_breakdown[missionKey] = {
            mission_id: mt.mission_id,
            mission_name: mt.missions?.name || 'Mission inconnue',
            mission_client: mt.missions?.client || 'Client inconnu',
            total_percentage: 0,
            report_count: 0,
            opportunities_count: 0,
            total_opportunity_value: 0
          };
        }

        stats[sdrKey].mission_breakdown[missionKey].total_percentage += mt.time_percentage;
        stats[sdrKey].mission_breakdown[missionKey].report_count++;
      });

      // Traiter les opportunités
      report.daily_opportunities?.forEach((opp: any) => {
        const missionKey = opp.mission_id;
        if (stats[sdrKey].mission_breakdown[missionKey]) {
          stats[sdrKey].mission_breakdown[missionKey].opportunities_count++;
          stats[sdrKey].mission_breakdown[missionKey].total_opportunity_value += opp.opportunity_value;
        }
      });
    });

    // Calculer les moyennes et convertir en array
    return Object.values(stats).map((stat: any) => ({
      ...stat,
      mission_breakdown: Object.values(stat.mission_breakdown).map((mb: any) => ({
        ...mb,
        average_percentage: mb.report_count > 0 ? mb.total_percentage / mb.report_count : 0
      }))
    }));
  },

  // Vérifier les CRA manquants
  async getMissingCRAReports(): Promise<any[]> {
    const { data, error } = await supabase.rpc('check_missing_cra_reports');
    if (error) throw error;
    return data || [];
  }
};
