
import { Mission } from "./types";

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  missions: Mission[];
  isToday: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  weeks: CalendarWeek[];
  currentDate: Date;
}

export interface DraggedMission {
  mission: Mission;
  sourceDate: Date;
}

export interface DropTargetDay {
  date: Date;
  isValid: boolean;
}

export interface MissionColors {
  [key: string]: {
    background: string;
    border: string;
    text: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Full' | 'Part';
  mission: Mission;
  color: string;
}
