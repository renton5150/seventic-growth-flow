
export interface TeleworkDay {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
}

export interface TeleworkCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  hasTelework: boolean;
}
