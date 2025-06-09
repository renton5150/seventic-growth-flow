
export type WorkScheduleRequestType = 'telework' | 'paid_leave' | 'unpaid_leave';
export type WorkScheduleStatus = 'pending' | 'approved' | 'rejected';

export interface WorkScheduleRequest {
  id: string;
  user_id: string;
  request_type: WorkScheduleRequestType;
  start_date: string;
  end_date: string;
  status: WorkScheduleStatus;
  is_exceptional: boolean;
  reason?: string;
  admin_comment?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
}

export interface WorkScheduleNotification {
  id: string;
  user_id: string;
  request_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface WorkScheduleCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  requests: WorkScheduleRequest[];
}

export interface WorkScheduleCalendarWeek {
  days: WorkScheduleCalendarDay[];
}

export interface WorkScheduleCalendarMonth {
  weeks: WorkScheduleCalendarWeek[];
  currentDate: Date;
}
