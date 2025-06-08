
export interface DailyActivityReport {
  id: string;
  sdr_id: string;
  report_date: string;
  total_percentage: number;
  comments?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  sdr_name?: string;
  sdr_email?: string;
}

export interface DailyMissionTime {
  id: string;
  report_id: string;
  mission_id: string;
  time_percentage: number;
  mission_comment?: string;
  created_at: string;
  updated_at: string;
  mission_name?: string;
  mission_client?: string;
}

export interface DailyOpportunity {
  id: string;
  report_id: string;
  mission_id: string;
  opportunity_name: string;
  opportunity_value: 5 | 10 | 20;
  created_at: string;
  updated_at: string;
  mission_name?: string;
}

export interface CRAReminder {
  id: string;
  sdr_id: string;
  missing_date: string;
  reminder_sent_at: string;
  email_sent: boolean;
}

export interface CreateCRARequest {
  report_date: string;
  mission_times: {
    mission_id: string;
    time_percentage: number;
    mission_comment?: string;
  }[];
  opportunities: {
    mission_id: string;
    opportunity_name: string;
    opportunity_value: 5 | 10 | 20;
  }[];
  comments?: string;
}

export interface CRAStatistics {
  sdr_id: string;
  sdr_name: string;
  period: string;
  total_reports: number;
  mission_breakdown: {
    mission_id: string;
    mission_name: string;
    mission_client: string;
    total_percentage: number;
    average_percentage: number;
    opportunities_count: number;
    total_opportunity_value: number;
  }[];
}
